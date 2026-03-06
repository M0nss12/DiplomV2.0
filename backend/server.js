require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================================
// ⚙️ БЛОК: КОНФИГУРАЦИЯ И НАСТРОЙКИ
// =====================================================================
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'my_super_secret_admin_123';
const TINKOFF_TERMINAL = process.env.TINKOFF_TERMINAL || 'TinkoffBankTest';
const TINKOFF_SECRET = process.env.TINKOFF_SECRET || 'ваш_секрет';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const upload = multer({ storage: multer.memoryStorage() });


app.use(cors({
    origin: ['https://diplomv2-0.onrender.com', 'http://localhost:3000'], // Разрешаем фронтенд на рендере и локально
    credentials: true
}));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_AVATARS = [
    `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/1.png`,
    `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/2.png`,
    `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/3.png`,
    `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/4.png`,
    `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/5.png`,
    `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/6.png`
];

// Настройка почты для работы на хостинге
// В файле server.js
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// ОБЯЗАТЕЛЬНО: добавь это сразу после создания transporter, 
// чтобы мы увидели статус в логах Render при запуске!
transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ СЕРВЕР RENDER НЕ МОЖЕТ ПОДКЛЮЧИТЬСЯ К GMAIL:", error.message);
    } else {
        console.log("✅ СЕРВЕР RENDER УСПЕШНО ПОДКЛЮЧЕН К GMAIL");
    }
});

// Обязательная проверка подключения при старте сервера
transporter.verify(function (error, success) {
    if (error) {
        // Если тут ошибка, то проблема в ENV или сетевой блокировке
        console.error("❌ Ошибка подключения к Gmail SMTP:", error.message); 
    } else {
        console.log("✅ Почтовый сервер Gmail готов к отправке.");
    }
});

// Обязательная проверка подключения при старте сервера
transporter.verify(function (error, success) {
    if (error) {
        // Если здесь ошибка, значит, проблема в EMAIL_USER/EMAIL_PASS на Render
        console.error("❌ Ошибка подключения к SMTP:", error.message); 
    } else {
        console.log("✅ Почтовый сервер готов к отправке сообщений (SendGrid)");
    }
});

// =====================================================================
// 📝 БЛОК: СИСТЕМНОЕ ЛОГИРОВАНИЕ
// =====================================================================
const LOGS_DIR = path.join(__dirname, 'logs');
const ERROR_LOG = path.join(LOGS_DIR, 'errors.log');
const ACTIONS_LOG = path.join(LOGS_DIR, 'actions.log');

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);
[ERROR_LOG, ACTIONS_LOG].forEach(f => { if (!fs.existsSync(f)) fs.writeFileSync(f, ''); });

const writeLog = (filePath, data) => {
    const entry = JSON.stringify({
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toLocaleString('ru-RU'),
        ...data
    }) + '\n';
    fs.appendFile(filePath, entry, (err) => { if (err) console.error('Ошибка записи лога:', err); });
};

const logActivity = (req, action, message, metadata = {}) => {
    let safeName = 'Аноним';
    if (req.headers['x-user-name']) {
        try { safeName = decodeURIComponent(req.headers['x-user-name']); } 
        catch (e) { safeName = req.headers['x-user-name']; }
    }
    writeLog(ACTIONS_LOG, {
        type: 'ACTION', action, message,
        user: {
            id: req.headers['x-user-id'] || 'guest',
            name: safeName,
            role: req.headers['x-user-role'] || 'guest'
        },
        ip: req.ip, details: metadata
    });
};

const logError = (err, req = null) => {
    writeLog(ERROR_LOG, {
        type: 'ERROR',
        message: err.message,
        stack: err.stack ? err.stack.split('\n')[1].trim() : 'N/A',
        fullStack: err.stack,
        url: req ? req.url : 'SYSTEM',
        method: req ? req.method : 'N/A',
        body: req && req.method !== 'GET' ? req.body : null,
        user: req ? (req.headers['x-user-id'] || 'guest') : 'system'
    });
};

app.use((req, res, next) => {
    if (req.url.startsWith('/api') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        res.on('finish', () => {
            if (res.statusCode < 400) {
                logActivity(req, `${req.method}_REQUEST`, `Успешный запрос на ${req.url}`);
            }
        });
    }
    next();
});

// =====================================================================
// 🛡️ БЛОК: УТИЛИТЫ
// =====================================================================
async function getYandexCoordinates(address) {
    if (!YANDEX_API_KEY) return null;
    try {
        const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&format=json&geocode=${encodeURIComponent(address)}`;
        const response = await axios.get(url);
        const geoObject = response.data.response.GeoObjectCollection.featureMember[0].GeoObject;
        const [lon, lat] = geoObject.Point.pos.split(' ').map(Number);
        return { lat, lon, fullAddress: geoObject.metaDataProperty.GeocoderMetaData.text };
    } catch (e) { return null; }
}

const verifyAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey === ADMIN_SECRET) next();
    else res.status(403).json({ error: 'Доступ запрещен.' });
};

function generateTinkoffToken(params) {
    const { Token, ...data } = params;
    data.Password = TINKOFF_SECRET;
    const sortedKeys = Object.keys(data).sort();
    const concatenatedValues = sortedKeys.reduce((acc, key) => acc + data[key], '');
    return crypto.createHash('sha256').update(concatenatedValues).digest('hex');
}

// =====================================================================
// 🖼️ API: ФАЙЛЫ
// =====================================================================
app.post('/api/upload/:folder', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).send('Файл не получен');
        const fileName = `${Date.now()}_${file.originalname}`;
        const { error } = await supabase.storage.from(req.params.folder).upload(fileName, file.buffer, { contentType: file.mimetype });
        if (error) throw error;
        const { data } = supabase.storage.from(req.params.folder).getPublicUrl(fileName);
        res.json({ url: data.publicUrl });
    } catch (err) { logError(err, req); res.status(500).json({ error: err.message }); }
});

// =====================================================================
// 🏠 API: МАРКЕТИНГ
// =====================================================================
app.get('/api/marketing/currency', async (req, res) => {
    try {
        const cbrRes = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        const valutes = cbrRes.data.Valute;
        res.json({
            usd: valutes.USD.Value.toFixed(2),
            eur: valutes.EUR.Value.toFixed(2),
            cny: valutes.CNY.Value.toFixed(2)
        });
    } catch (e) {
        logError(e, req);
        res.json({ usd: '91.50', eur: '99.20', cny: '12.60' });
    }
});

app.get('/api/marketing/news', async (req, res) => {
    const { city } = req.query;
    if (!NEWS_API_KEY) return res.json([]);
    try {
        const url = `https://newsapi.org/v2/everything?q=автомобили%20${encodeURIComponent(city || 'Россия')}&language=ru&apiKey=${NEWS_API_KEY}`;
        const resp = await axios.get(url);
        res.json(resp.data.articles.slice(0, 5).map(a => ({ title: a.title, image: a.urlToImage, url: a.url, source: a.source.name })));
    } catch (e) { res.json([]); }
});

app.get('/api/marketing/brands', async (req, res) => {
    const { data } = await supabase.from('brands').select('*').eq('is_popular', true);
    res.json(data || []);
});

app.get('/api/marketing/hot-deals', async (req, res) => {
    const { data } = await supabase.from('products').select('*, brands(*), product_stocks(*, warehouses(city_name))').not('discount_price', 'is', null).limit(12);
    res.json(data || []);
});

app.get('/api/marketing/popular-categories', async (req, res) => {
    try {
        const { data: sales } = await supabase.from('order_items').select('product_id, products(category_id)');
        if (!sales || !sales.length) {
            const { data: cats } = await supabase.from('categories').select('*').limit(8);
            return res.json(cats);
        }
        const counts = {}; 
        sales.forEach(s => { if (s.products) { const cid = s.products.category_id; counts[cid] = (counts[cid] || 0) + 1; } });
        const sortedIds = Object.keys(counts).sort((a,b) => counts[b] - counts[a]).slice(0, 8);
        const { data: cats } = await supabase.from('categories').select('*').in('id', sortedIds);
        res.json(cats || []);
    } catch (e) { res.json([]); }
});

app.get('/api/marketing/about-info', async (req, res) => {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { data: b } = await supabase.from('brands').select('name, logo_url');
    res.json({ totalProducts: count || 0, totalBrands: b ? b.length : 0, brandsList: b || [] });
});

app.post('/api/feedback/send', async (req, res) => {
    const { name, contact, message } = req.body;
    
    const mailOptions = { 
        from: process.env.EMAIL_USER, // Отправляем от СЕБЯ
        replyTo: contact,             // Но отвечаем КЛИЕНТУ
        to: 'monsschogath@gmail.com', 
        subject: `Заявка от ${name} (ApexDrive)`, 
        text: `Имя: ${name}\nКонтакты для связи: ${contact}\n\nСообщение:\n${message}` 
    };

    try { 
        await transporter.sendMail(mailOptions); 
        res.json({ success: true }); 
    } catch (e) { 
        console.error("🔴 ОШИБКА ОТПРАВКИ ПИСЬМА:", e); // Выведет ошибку в логи Render
        logError(e, req); 
        res.status(500).json({ error: e.message }); 
    }
});

// =====================================================================
// 🛒 API: КАТАЛОГ И ПОИСК
// =====================================================================
app.get('/api/categories', async (req, res) => {
    const { data, error } = await supabase.from('categories').select('*').order('id');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.get('/api/products', async (req, res) => {
    const { category_id } = req.query;
    let query = supabase.from('products').select(`*, brands (*), product_stocks (quantity, warehouses (city_name, address))`);
    if (category_id && category_id !== 'undefined') query = query.eq('category_id', parseInt(category_id));
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.get('/api/global-search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ products: [], categories: [] });
    try {
        const { data: products } = await supabase.from('products').select('id, name, price, image_url, sku, discount_price').or(`name.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`).limit(5);
        const { data: categories } = await supabase.from('categories').select('id, name, slug').ilike('name', `%${q}%`).limit(3);
        logActivity(req, 'SEARCH', `Поиск по запросу: "${q}"`);
        res.json({ products: products || [], categories: categories || [] });
    } catch (err) { logError(err, req); res.status(500).json({ error: err.message }); }
});

app.get('/api/products/:id', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*, brands(*), categories(name), product_stocks(*, warehouses(city_name, address))').eq('id', req.params.id).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/products/recent', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.json([]);
    const { data, error } = await supabase.from('products').select(`id, name, price, discount_price, image_url, product_stocks (quantity, warehouses (city_name))`).in('id', ids);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// =====================================================================
// 👤 API: ПРОФИЛЬ, КАРТЫ, ИЗБРАННОЕ
// =====================================================================
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, phone, password, first_name, last_name, otchestvo, city } = req.body;
        // 1. ГЕНЕРАЦИЯ СТРОКОВОГО ID
        const newUserId = Date.now().toString(); 
        
        let filter = email ? `email.eq.${email}` : `phone_number.eq.${phone}`;
        const { data: existing } = await supabase.from('users').select('*').or(filter).limit(1).single();

        if (existing && !existing.password_hash) {
            const { data } = await supabase.from('users').update({ password_hash: password, role: 'user', first_name, last_name, otchestvo, saved_address: city }).eq('id', existing.id).select();
            return res.json(data[0]);
        }
        // 2. ИСПОЛЬЗОВАНИЕ СТРОКОВОГО ID ПРИ ВКЛАДКЕ
        const { data, error } = await supabase.from('users').insert([{ id: newUserId, role: 'user', email, phone_number: phone, password_hash: password, first_name, last_name, otchestvo, saved_address: city, avatar_url: DEFAULT_AVATARS[0] }]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (e) { logError(e, req); res.status(500).json({ error: e.message }); }
});

app.post('/api/users/login', async (req, res) => {
    const { login, password } = req.body;
    const { data } = await supabase.from('users').select('*').or(`email.eq.${login},phone_number.eq.${login}`).eq('password_hash', password).single();
    if (!data) return res.status(401).json({ error: 'Неверные данные' });
    res.json(data);
});

app.get('/api/users/profile/:id', async (req, res) => {
    // УБРАН parseInt
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(data);
});

app.put('/api/users/profile/:id', async (req, res) => {
    // УБРАН parseInt
    const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

app.post('/api/users/change-password/:id', async (req, res) => {
    // УБРАН parseInt
    const { oldPassword, newPassword } = req.body;
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.params.id).single();
    if (user.password_hash !== oldPassword) return res.status(400).json({ error: 'Пароль неверный' });
    await supabase.from('users').update({ password_hash: newPassword }).eq('id', req.params.id);
    res.json({ success: true });
});

// КАРТЫ ПОЛЬЗОВАТЕЛЯ
app.get('/api/cards/:userId', async (req, res) => {
    // УБРАН parseInt
    const { data, error } = await supabase.from('user_cards').select('*').eq('user_id', req.params.userId).order('is_default', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.post('/api/cards', async (req, res) => {
    try {
        const { user_id, number, holder, expiry } = req.body;
        const masked = `**** **** **** ${number.slice(-4)}`;
        let brand = number.startsWith('4') ? 'visa' : number.startsWith('2') ? 'mir' : 'mastercard';
        const { data, error } = await supabase.from('user_cards').insert([{ user_id, card_number_masked: masked, card_holder: holder.toUpperCase(), expiry_date: expiry, brand }]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (e) { logError(e, req); res.status(500).json({ error: e.message }); }
});

app.delete('/api/cards/:id', async (req, res) => {
    const { error } = await supabase.from('user_cards').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.send('ok');
});

// ИЗБРАННОЕ
app.get('/api/wishlist/:userId', async (req, res) => {
    // УБРАН parseInt
    const { data, error } = await supabase.from('wishlists').select(`id, product_id, products (*, product_stocks (*, warehouses (*)))`).eq('user_id', req.params.userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.post('/api/wishlist', async (req, res) => {
    const { user_id, product_id } = req.body;
    const { data: existing } = await supabase.from('wishlists').select('id').eq('user_id', user_id).eq('product_id', product_id).maybeSingle();
    if (existing) return res.json(existing);
    const { data, error } = await supabase.from('wishlists').insert([{ user_id, product_id }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.delete('/api/wishlist/:userId/:prodId', async (req, res) => {
    // УБРАН parseInt
    await supabase.from('wishlists').delete().eq('user_id', req.params.userId).eq('product_id', req.params.prodId);
    res.send('ok');
});

app.delete('/api/wishlist/:id', async (req, res) => {
    await supabase.from('wishlists').delete().eq('id', req.params.id);
    res.send('ok');
});

app.get('/api/users/default-avatars', (req, res) => res.json(DEFAULT_AVATARS));
app.get('/api/vehicles/:userId', async (req, res) => res.json([]));

// =====================================================================
// 🛍️ API: ЗАКАЗЫ И ОПЛАТА
// =====================================================================
app.get('/api/orders/test-geo', async (req, res) => {
    const { address } = req.query;
    try {
        let geo = await getYandexCoordinates(address);
        if (!geo) {
            const { data: wh } = await supabase.from('warehouses').select('*').ilike('city_name', `%${address}%`).limit(1).maybeSingle();
            if (wh) geo = { lat: 55.75, lon: 37.61, fullAddress: wh.city_name };
        }
        if (!geo) return res.status(404).json({ error: 'Город не найден' });
        res.json({ coordinates: { lat: geo.lat, lon: geo.lon }, fullAddress: geo.fullAddress });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/:userId', async (req, res) => {
    // УБРАН parseInt
    const { data, error } = await supabase.from('orders').select(`*, order_items (*, products (name, image_url))`).eq('user_id', req.params.userId).order('created_at', { ascending: false });
    if (error) return res.json([]);
    res.json(data || []);
});

app.post('/api/orders', async (req, res) => {
    const { customer_name, customer_email, customer_phone, customer_city, items, warehouse_id, payment_method, payment_status: bodyStatus, shipping_cost } = req.body;
    try {
        const { data: allWarehouses } = await supabase.from('warehouses').select('*');
        const selectedWarehouse = allWarehouses.find(w => w.id === warehouse_id);
        if (!selectedWarehouse) return res.status(400).json({ error: 'Пункт выдачи не найден' });

        let finalStatus = bodyStatus || ((payment_method === 'card') ? 'awaiting_payment' : 'unpaid');

        let filter = customer_email ? `email.eq.${customer_email}` : `phone_number.eq.${customer_phone}`;
        let { data: user } = await supabase.from('users').select('id').or(filter).maybeSingle();
        let userId = user?.id;
        if (!userId) {
            const newId = Date.now().toString();
            const { data: newUser } = await supabase.from('users').insert([{ id: newId, role: 'guest', first_name: customer_name, email: customer_email || null, phone_number: customer_phone || null, avatar_url: DEFAULT_AVATARS[0], saved_address: customer_city }]).select();
            userId = newUser[0].id;
        }

        let totalPrice = 0; 
        let itemsData = []; 
        let needsShippingToPVZ = false; 

        for (let item of items) {
            const { data: p } = await supabase.from('products').select('*, product_stocks(*)').eq('id', item.product_id).single();
            if (!p) continue;
            const currentPrice = p.discount_price || p.price;
            totalPrice += currentPrice * item.quantity;
            itemsData.push({ product_id: p.id, quantity: item.quantity, unit_price: currentPrice });
            
            // --- ПРОВЕРКА МЕЖГОРОДА (ИСПРАВЛЕНО) ---
            // Считаем общий остаток этого товара во ВСЕМ городе выбранного ПВЗ
            const totalInCity = p.product_stocks.reduce((acc, stockRecord) => {
                const wh = allWarehouses.find(w => w.id === stockRecord.warehouse_id);
                if (wh && wh.city_name.toLowerCase() === selectedWarehouse.city_name.toLowerCase()) {
                    return acc + stockRecord.quantity;
                }
                return acc;
            }, 0);

            // Если в городе суммарно меньше, чем заказал юзер - значит везем из другого города
            if (totalInCity < item.quantity) needsShippingToPVZ = true;

            // Списание остатков
            let amountNeeded = item.quantity;
            const sortedStocks = [...p.product_stocks].sort((a, b) => (a.warehouse_id === warehouse_id ? -1 : 1));
            for (let stock of sortedStocks) {
                if (amountNeeded <= 0) break;
                if (stock.quantity <= 0) continue;
                const takeAmount = Math.min(stock.quantity, amountNeeded);
                amountNeeded -= takeAmount;
                await supabase.from('product_stocks').update({ quantity: stock.quantity - takeAmount }).eq('id', stock.id);
            }
        }

        const finalShippingCost = Number(shipping_cost) || 0;
        const finalTotalPrice = Math.round(totalPrice + finalShippingCost);

        const { data: order, error: oErr } = await supabase.from('orders').insert([{ 
            user_id: userId, payment_method, payment_status: finalStatus, 
            delivery_type: 'pickup', delivery_status: needsShippingToPVZ ? 'shipping' : 'awaiting', 
            shipping_cost: finalShippingCost, total_price: finalTotalPrice, 
            delivery_address: `${selectedWarehouse.city_name}, ${selectedWarehouse.address}`, 
            created_at: new Date().toISOString() 
        }]).select();

        if (oErr) throw oErr;
        await supabase.from('order_items').insert(itemsData.map(i => ({ ...i, order_id: order[0].id })));
        res.json({ orderId: order[0].id, total: finalTotalPrice });
    } catch (err) { logError(err, req); res.status(500).json({ error: 'Ошибка сервера' }); }
});

app.patch('/api/orders/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('orders').update(req.body).eq('id', req.params.id).select();
        res.json(data[0]);
    } catch (e) { logError(e, req); res.status(500).json({ error: e.message }); }
});

// ТИНЬКОФФ
app.post('/api/payment/tinkoff-init', async (req, res) => {
    try {
        const { amount, orderId, customerEmail } = req.body;
        const payload = { TerminalKey: TINKOFF_TERMINAL, Amount: amount * 100, OrderId: orderId.toString(), Description: `Оплата в ApexDrive, заказ №${orderId}`, DATA: { Email: customerEmail } };
        payload.Token = generateTinkoffToken(payload);
        const response = await axios.post('https://rest-api-test.tinkoff.ru/v2/Init', payload);
        if (response.data.Success) res.json({ confirmation_url: response.data.PaymentURL });
        else throw new Error(response.data.Message);
    } catch (e) { logError(e, req); res.status(500).json({ error: e.message }); }
});

// =====================================================================
// 💬 API: ОТЗЫВЫ
// =====================================================================
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const { data, error } = await supabase.from('reviews').select(`*, users (first_name, avatar_url)`).eq('product_id', req.params.productId).eq('is_approved', true).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { product_id, user_id, rating, comment, pros, cons } = req.body;
        const { data, error } = await supabase.from('reviews').insert([{ product_id, user_id, rating, comment, pros, cons, is_approved: true, created_at: new Date().toISOString() }]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/reviews/:id', async (req, res) => {
    try {
        const { rating, comment, pros, cons } = req.body;
        const { data, error } = await supabase.from('reviews').update({ rating, comment, pros, cons, created_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// =====================================================================
// 👑 API: АДМИНКА
// =====================================================================
app.get('/api/admin/system/logs', verifyAdmin, (req, res) => {
    const { type } = req.query;
    const targetFile = type === 'errors' ? ERROR_LOG : ACTIONS_LOG;
    try {
        if (!fs.existsSync(targetFile)) return res.json([]);
        const lines = fs.readFileSync(targetFile, 'utf8').trim().split('\n');
        const logs = lines.filter(l => l.trim()).map(line => {
            try { return JSON.parse(line); } catch(e) { return null; }
        }).filter(l => l).reverse();
        res.json(logs.slice(0, 100)); 
    } catch (e) { res.status(500).json({ error: 'Ошибка чтения логов' }); }
});

app.get('/api/admin/:table', verifyAdmin, async (req, res) => {
    const { data, error } = await supabase.from(req.params.table).select('*').order('id', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data || []);
});

app.post('/api/admin/:table', verifyAdmin, async (req, res) => {
    const { data, error } = await supabase.from(req.params.table).insert([req.body]).select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

app.put('/api/admin/:table/:id', verifyAdmin, async (req, res) => {
    const { data, error } = await supabase.from(req.params.table).update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

app.delete('/api/admin/:table/:id', verifyAdmin, async (req, res) => {
    const { error } = await supabase.from(req.params.table).delete().eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.send('Удалено');
});

// =====================================================================
// 🚨 ГЛОБАЛЬНЫЙ ОБРАБОТЧИК
// =====================================================================
app.use((err, req, res, next) => {
    logError(err, req);
    res.status(500).json({ error: 'Критическая ошибка сервера', details: err.message });
});

app.get(/(.*)/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 ApexDrive Server Active: http://localhost:${PORT}`));