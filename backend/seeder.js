require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const STORAGE_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public`;

// --- ДАННЫЕ ИЗ ФОТО ---
const categoryImages = ['Electrics.webp', 'Engine.webp', 'Filters.webp', 'FilterSalona.webp', 'GRM.webp', 'Instruments.webp', 'Kolodkidiski.webp', 'KuzovniyeDetails.webp', 'Maslaniye.webp', 'Oils.webp', 'OtoplenieCondition.webp', 'Podveska.webp', 'Porshni.webp', 'ProkladkiSalniki.webp', 'Prugini.webp', 'RychagiOpora.webp', 'ShinyDiski.webp', 'SuppotrCilindrs.webp', 'TormoznayaSystem.webp', 'Vihlop.webp', 'Vozdush.webp'];
const productImages = ['Amortizator.webp', 'AntiFreeze.webp', 'BallOpora.webp', 'BumperFront.webp', 'CilinderGlavTormoz.webp', 'CompressorCondition.webp', 'CriloLeft.webp', 'DiskLitoy.webp', 'DiskTormoznoy.webp', 'DomkratGidravlic.webp', 'FaraRight.webp', 'FilterAir.webp', 'FilterOil.webp', 'FilterSaloNaUgolniy.webp', 'Generator.webp', 'Glushitel.webp', 'KolodkiTormoz.webp', 'LambdaZond.webp', 'LampHeadLigt.webp', 'NaborKeys.webp', 'Natazitel.webp', 'NatazitelAvtoComplekt.webp', 'OilMotor.webp', 'Porshen.webp', 'ProkladkaGBC.webp', 'PruzinaPodveski.webp', 'RichagiPodveski.webp', 'SalnikKolenvala.webp', 'Shatun.webp', 'ShinaWinter.webp', 'Starter.webp', 'SupportTormoz.webp', 'TormozDisk.webp', 'TormozWater.webp'];
const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск', 'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль'];
const brandNames = ['Bosch', 'Brembo', 'NGK', 'Denso', 'Mann-Filter', 'Mahle', 'TRW', 'KYB', 'Sachs', 'Lemforder', 'Motul', 'LiquiMoly', 'Castrol', 'Mobil', 'Shell', 'Valeo', 'Hella', 'Contitech', 'Gates', 'Dayco', 'SKF', 'Febi', 'SNR', 'INA', 'LUK', 'Textar', 'ATE', 'Ferodo', 'Nissens', 'Delphi'];

const catsInfo = [
    { n: 'Моторные масла', s: 'motor-oils', specs: [['Вязкость: 5W-30', 'Объем: 4л', 'Тип: Синтетика'], ['Вязкость: 10W-40', 'Объем: 1л', 'Тип: Минеральное']] },
    { n: 'Тормозные колодки', s: 'brake-pads', specs: [['Материал: Керамика', 'Ось: Передняя', 'Датчик: Есть'], ['Материал: Металл', 'Ось: Задняя', 'Датчик: Нет']] },
    { n: 'Свечи зажигания', s: 'spark-plugs', specs: [['Электрод: Иридий', 'Зазор: 1.1мм', 'Ресурс: 100к'], ['Электрод: Никель', 'Зазор: 0.8мм', 'Ресурс: 30к']] },
    { n: 'Амортизаторы', s: 'shock-abs', specs: [['Тип: Газовый', 'Ход: 160мм', 'Жесткость: High'], ['Тип: Масляный', 'Ход: 120мм', 'Жесткость: Soft']] },
    { n: 'Фильтры масляные', s: 'oil-filters', specs: [['Тип: Накручиваемый', 'Резьба: M20', 'Клапан: Есть'], ['Тип: Картридж', 'Резьба: Нет', 'Клапан: Нет']] },
    { n: 'Ремни ГРМ', s: 'grm-belts', specs: [['Зубья: 122', 'Ширина: 25мм', 'Корд: Кевлар'], ['Зубья: 110', 'Ширина: 19мм', 'Корд: Стекловолокно']] },
    { n: 'Помпы водяные', s: 'water-pumps', specs: [['Крыльчатка: Чугун', 'Прокладка: Металл', 'Зубья: 22'], ['Крыльчатка: Пластик', 'Прокладка: Резина', 'Зубья: 19']] },
    { n: 'Радиаторы', s: 'radiators', specs: [['Материал: Алюминий', 'Тип: Паяный', 'Давление: 2.1'], ['Материал: Медь', 'Тип: Сборный', 'Давление: 1.4']] },
    { n: 'АКБ', s: 'batteries', specs: [['Емкость: 75Ah', 'Ток: 720A', 'Полярность: Обр'], ['Емкость: 60Ah', 'Ток: 510A', 'Полярность: Прям']] },
    { n: 'Лампы H7', s: 'bulbs-h7', specs: [['Тип: LED', 'Кельвин: 6000K', 'Люмен: 4000'], ['Тип: Галоген', 'Кельвин: 3200K', 'Люмен: 1500']] }
];
for(let i=10; i<30; i++) catsInfo.push({ n: `Запчасть Тип ${i+1}`, s: `part-type-${i+1}`, specs: [[`Параметр А: ${i}`, `Параметр Б: X`, `Параметр В: Max`], [`Параметр А: 0`, `Параметр Б: Y`, `Параметр В: Min`]] });

async function seed() {
    try {
        console.log('🧹 Очистка данных...');
        // Очищаем таблицы. Порядок важен из-за внешних ключей.
        const tables = ['user_cards', 'wishlists', 'reviews', 'order_items', 'orders', 'product_stocks', 'products', 'categories', 'brands', 'users', 'warehouses'];
        
        for (const t of tables) {
            // Для текстовых ID используем .not('id', 'is', null) для надежности
            await supabase.from(t).delete().not('id', 'is', null);
        }

        // 1. БРЕНДЫ (30)
        const { data: dbBrands } = await supabase.from('brands').insert(brandNames.map(b => ({ name: b, logo_url: `${STORAGE_URL}/brands/${b}.webp`, country: 'EU' }))).select();

        // 2. КАТЕГОРИИ (30)
        const { data: dbCats } = await supabase.from('categories').insert(catsInfo.map((c, i) => ({ name: c.n, slug: c.s, image_url: `${STORAGE_URL}/categories/${categoryImages[i % categoryImages.length]}` }))).select();

        // 3. СКЛАДЫ (50: 25 городов по 2 ПВЗ)
        const warehousesData = [];
        cities.forEach(city => {
            warehousesData.push({ city_name: city, address: 'ул. Ленина, 10', is_pickup_point: true }, { city_name: city, address: 'пр. Мира, 25', is_pickup_point: true });
        });
        const { data: dbWarehouses } = await supabase.from('warehouses').insert(warehousesData).select();

        // 4. ПОЛЬЗОВАТЕЛИ (30) - ИСПРАВЛЕНО ПОД TEXT ID
        console.log('👥 Создание пользователей...');
        const { data: dbUsers } = await supabase.from('users').insert(Array.from({ length: 30 }).map((_, i) => ({
            id: `seed_user_${i + 1}`, // ТЕКСТОВЫЙ ID
            role: i === 0 ? 'admin' : 'user',
            email: `user${i+1}@apexdrive.ru`, 
            phone_number: `+790088800${i.toString().padStart(2, '0')}`,
            password_hash: '123', 
            first_name: 'Имя' + i, 
            last_name: 'Фамилия' + i,
            avatar_url: `${STORAGE_URL}/avatars/${(i % 6) + 1}.png`, 
            saved_address: cities[i % cities.length]
        }))).select();

        // 5. ТОВАРЫ (60)
        const prodsToInsert = [];
        dbCats.forEach((cat, i) => {
            const catDef = catsInfo[i];
            for (let j = 0; j < 2; j++) {
                const specSet = catDef.specs[j];
                const fullDescription = `${specSet.join('. ')}. Гарантия: 24 мес. Страна: Германия. Вес: ${j+1}кг.`;
                prodsToInsert.push({
                    category_id: cat.id, brand_id: dbBrands[(i + j) % 30].id,
                    sku: `SKU-${cat.slug}-${j}`, name: `${cat.name} ${dbBrands[(i + j) % 30].name} ${j === 0 ? 'Premium' : 'Standard'}`,
                    description: fullDescription, price: 1500 + (i * 200) + (j * 500), weight_kg: j + 1,
                    image_url: `${STORAGE_URL}/products/${productImages[(i * 2 + j) % productImages.length]}`
                });
            }
        });
        const { data: dbProducts } = await supabase.from('products').insert(prodsToInsert).select();

        // 6. ОСТАТКИ (product_stocks) - РОВНО 200 ЗАПИСЕЙ
        const stocksData = [];
        for (let i = 0; i < 200; i++) {
            stocksData.push({
                product_id: dbProducts[i % 60].id, warehouse_id: dbWarehouses[i % 50].id,
                quantity: 20 + i, shelf_location: `R-${i}`
            });
        }
        await supabase.from('product_stocks').insert(stocksData);

        // 7. ЗАКАЗЫ (90) + ИЗБРАННОЕ (30)
        console.log('📦 Создание заказов и отзывов...');
        const reviewsData = [];
        const wishlistData = [];
        for (let i = 0; i < 30; i++) {
            const user = dbUsers[i];
            wishlistData.push({ user_id: user.id, product_id: dbProducts[i].id });
            
            const scenarios = [
                { ds: 'delivered', ps: 'paid', pm: 'card' },
                { ds: 'shipping', ps: 'awaiting_payment', pm: 'card_pickup' },
                { ds: 'cancelled', ps: 'unpaid', pm: 'cash' }
            ];
            
            for (const sc of scenarios) {
                const prod = dbProducts[(i + Math.floor(Math.random()*50)) % 60];
                const { data: ord } = await supabase.from('orders').insert({
                    user_id: user.id, 
                    payment_method: sc.pm, 
                    payment_status: sc.ps, 
                    delivery_status: sc.ds,
                    total_price: prod.price, 
                    delivery_address: `${user.saved_address}, ПВЗ Тестовый`
                }).select().single();

                await supabase.from('order_items').insert({ 
                    order_id: ord.id, 
                    product_id: prod.id, 
                    quantity: 1, 
                    unit_price: prod.price 
                });

                if (sc.ds === 'delivered') {
                    reviewsData.push({ 
                        product_id: prod.id, 
                        user_id: user.id, 
                        rating: 5, 
                        comment: 'Отличный товар, характеристики как в описании!', 
                        is_approved: true 
                    });
                }
            }
        }
        await supabase.from('wishlists').insert(wishlistData);
        await supabase.from('reviews').insert(reviewsData.slice(0, 120));

        console.log('✅ База успешно заполнена!');
        console.log('📊 Итог: 30 категорий, 60 товаров, 200 остатков, 90 заказов, 30 пользователей.');
    } catch (e) { 
        console.error('❌ Ошибка при сидировании:', e.message); 
    }
}

seed();