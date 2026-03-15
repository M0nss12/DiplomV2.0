require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const STORAGE_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public`;

// --- СПИСКИ ДАННЫХ ---
const categoryNames = [
    'Электрика', 'Двигатель', 'Фильтры', 'Фильтры салона', 'ГРМ', 'Инструменты', 'Колодки и диски', 
    'Кузовные детали', 'Масляная система', 'Масла', 'Отопление и кондиционирование', 'Подвеска', 
    'Поршневая группа', 'Прокладки и сальники', 'Пружины', 'Рычаги и опоры', 'Шины и диски', 
    'Суппорты и цилиндры', 'Тормозная система', 'Выхлопная система', 'Воздушная система'
];

const realProductNames = {
    'Электрика': ['Генератор переменного тока 140А', 'Стартер редукторный 1.4кВт', 'Датчик положения коленвала'],
    'Двигатель': ['Комплект вкладышей шатунных', 'Клапан впускной усиленный', 'Опора двигателя правая гидравлическая'],
    'Фильтры': ['Фильтр масляный высокой очистки', 'Фильтр топливный тонкой очистки', 'Фильтр воздушный панельный'],
    'Фильтры салона': ['Фильтр салонный угольный Anti-Bacterial', 'Фильтр салонный многослойный', 'Фильтр салона стандартный'],
    'ГРМ': ['Ремень ГРМ усиленный', 'Ролик натяжителя саморегулирующийся', 'Комплект цепи ГРМ с фазовращателями'],
    'Инструменты': ['Набор головок торцевых 1/2 24 предм.', 'Ключ динамометрический 40-210 Нм', 'Домкрат подкатной гидравлический 3т'],
    'Колодки и диски': ['Колодки тормозные керамические X-Series', 'Диск тормозной перфорированный', 'Колодки тормозные задние полуметалл'],
    'Кузовные детали': ['Капот стальной под окраску', 'Крыло переднее левое оцинкованное', 'Бампер передний грунтованный'],
    'Масляная система': ['Насос масляный шестеренчатый', 'Радиатор масляный алюминиевый', 'Датчик давления масла электронный'],
    'Масла': ['Моторное масло 8100 X-cess 5W-40', 'Трансмиссионное масло ATF VI', 'Моторное масло Helix Ultra 0W-30'],
    'Отопление и кондиционирование': ['Компрессор кондиционера в сборе', 'Радиатор отопителя медный', 'Вентилятор отопителя с блоком управления'],
    'Подвеска': ['Амортизатор газомасляный Excel-G', 'Стойка стабилизатора усиленная', 'Сайлентблок переднего рычага полиуретан'],
    'Поршневая группа': ['Поршень двигателя с антифрикционным покрытием', 'Кольца поршневые комплект на 4 цилиндра', 'Палец поршневой стальной'],
    'Прокладки и сальники': ['Прокладка ГБЦ многослойная стальная', 'Сальник коленвала передний витоновый', 'Прокладка клапанной крышки силиконовая'],
    'Пружины': ['Пружина подвески передняя усиленная', 'Пружина задняя с переменным витком', 'Комплект заниженных пружин -30мм'],
    'Рычаги и опоры': ['Рычаг передний нижний в сборе', 'Опора шаровая передняя под болты', 'Тяга рулевая продольная'],
    'Шины и диски': ['Шина зимняя шипованная Ice Guard', 'Диск литой легкосплавный Hyper Silver', 'Шина летняя дождевая Sport Contact'],
    'Суппорты и цилиндры': ['Суппорт тормозной передний правый', 'Цилиндр тормозной главный', 'Ремкомплект суппорта с поршнем'],
    'Тормозная система': ['Шланг тормозной армированный', 'Вакуумный усилитель тормозов', 'Трос стояночного тормоза левый'],
    'Выхлопная система': ['Глушитель основной нержавеющая сталь', 'Резонатор выхлопной системы', 'Каталитический нейтрализатор Euro-5'],
    'Воздушная система': ['Патрубок интеркулера силиконовый', 'Корпус воздушного фильтра', 'Датчик массового расхода воздуха']
};

const categoryImages = ['Electrics.webp', 'Engine.webp', 'Filters.webp', 'FilterSalona.webp', 'GRM.webp', 'Instruments.webp', 'Kolodkidiski.webp', 'KuzovniyeDetails.webp', 'Maslaniye.webp', 'Oils.webp', 'OtoplenieCondition.webp', 'Podveska.webp', 'Porshni.webp', 'ProkladkiSalniki.webp', 'Prugini.webp', 'RychagiOpora.webp', 'ShinyDiski.webp', 'SuppotrCilindrs.webp', 'TormoznayaSystem.webp', 'Vihlop.webp', 'Vozdush.webp'];
const productImages = ['Amortizator.webp', 'AntiFreeze.webp', 'BallOpora.webp', 'BumperFront.webp', 'CilinderGlavTormoz.webp', 'CompressorCondition.webp', 'CriloLeft.webp', 'DiskLitoy.webp', 'DiskTormoznoy.webp', 'DomkratGidravlic.webp', 'FaraRight.webp', 'FilterAir.webp', 'FilterOil.webp', 'FilterSaloNaUgolniy.webp', 'Generator.webp', 'Glushitel.webp', 'KolodkiTormoz.webp', 'LambdaZond.webp', 'LampHeadLigt.webp', 'NaborKeys.webp', 'Natazitel.webp', 'NatazitelAvtoComplekt.webp', 'OilMotor.webp', 'Porshen.webp', 'ProkladkaGBC.webp', 'PruzinaPodveski.webp', 'RichagiPodveski.webp', 'SalnikKolenvala.webp', 'Shatun.webp', 'ShinaWinter.webp', 'Starter.webp', 'SupportTormoz.webp', 'TormozDisk.webp', 'TormozWater.webp'];
const brandNames = ['Bosch', 'Brembo', 'NGK', 'Denso', 'Mann-Filter', 'Mahle', 'TRW', 'KYB', 'Sachs', 'Lemforder', 'Motul', 'LiquiMoly', 'Castrol', 'Mobil', 'Shell', 'Valeo', 'Hella', 'Contitech', 'Gates', 'Dayco', 'SKF', 'Febi', 'SNR', 'INA', 'LUK', 'Textar', 'ATE', 'Ferodo', 'Nissens', 'Delphi'];
const cities60 = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск', 'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль', 'Владивосток', 'Махачкала', 'Томск', 'Оренбург', 'Кемерово', 'Новокузнецк', 'Рязань', 'Набережные Челны', 'Астрахань', 'Пенза', 'Киров', 'Липецк', 'Чебоксары', 'Балашиха', 'Калининград', 'Тула', 'Курск', 'Севастополь', 'Сочи', 'Ставрополь', 'Улан-Удэ', 'Тверь', 'Магнитогорск', 'Иваново', 'Брянск', 'Белгород', 'Сургут', 'Владимир', 'Чита', 'Архангельск', 'Нижний Тагил', 'Смоленск', 'Волжский', 'Курган', 'Череповец'];

function getRealisticSpecs(catName, pIdx) {
    const specsMap = {
        'Масла': [
            ['Вязкость: 5W-40', 'Тип: Синтетическое', 'Объем: 4л', 'Допуск: VW 502.00', 'ACEA: A3/B4', 'API: SN/CF', 'Температура вспышки: 230°C', 'Плотность: 0.850', 'Щелочное число: 10.1'],
            ['Вязкость: ATF VI', 'Тип: Трансмиссионное', 'Объем: 1л', 'Допуск: Dexron VI', 'Цвет: Красный', 'Температура застывания: -54°C', 'Кинематическая вязкость: 6.0', 'Защита от износа: AW/EP', 'Тип базы: PAO'],
            ['Вязкость: 0W-30', 'Тип: Энергосберегающее', 'Объем: 5л', 'Допуск: BMW LL-04', 'ACEA: C3', 'API: SP', 'Индекс вязкости: 182', 'Сульфатная зольность: 0.8%', 'Испаряемость NOACK: 9.2%']
        ],
        'Колодки и диски': [
            ['Тип: Керамические', 'Толщина: 19.5 мм', 'Датчик: Встроенный', 'Длина: 156 мм', 'Ширина: 68 мм', 'Состав: Low-Metallic', 'Ось: Передняя', 'Вес: 2.3 кг', 'Сертификат: ECE-R90'],
            ['Тип: Вентилируемый', 'Диаметр: 312 мм', 'Толщина: 25 мм', 'Разболтовка: 5x112', 'Центр. отверстие: 65 мм', 'Покрытие: Антикоррозийное', 'Материал: Высокоуглеродистый чугун', 'Мин. толщина: 22 мм', 'Вес: 8.5 кг'],
            ['Тип: Органические', 'Толщина: 16.2 мм', 'Датчик: Не предусмотрен', 'Длина: 120 мм', 'Ширина: 45 мм', 'Состав: Ceramic-Organic', 'Ось: Задняя', 'Вес: 1.1 кг', 'Рабочая температура: до 500°C']
        ]
    };
    const defaultSpecs = [
        ['Материал: Сплав 6061', 'Класс: OEM', 'Твердость: 45 HRC', 'Давление: 3.0 Бар', 'Температура: -40/+120°C', 'Ресурс: 60к км', 'Покрытие: Никель', 'Вес: 1.2 кг', 'Гарантия: 24 мес'],
        ['Материал: Резина EPDM', 'Класс: Premium', 'Твердость: 60 Shore A', 'Давление: 5.5 Бар', 'Температура: -50/+150°C', 'Ресурс: 80к км', 'Покрытие: Тефлон', 'Вес: 0.8 кг', 'Гарантия: 12 мес'],
        ['Материал: Сталь Cr-V', 'Класс: Professional', 'Твердость: 52 HRC', 'Давление: 2.1 Бар', 'Температура: -30/+90°C', 'Ресурс: 100к км', 'Покрытие: Хром', 'Вес: 0.5 кг', 'Гарантия: 36 мес']
    ];
    const categorySpecs = specsMap[catName] || defaultSpecs;
    return categorySpecs[pIdx].join('. ');
}

async function seed() {
    try {
        console.log('🧹 Очистка...');
        const tables = ['user_cards', 'wishlists', 'reviews', 'order_items', 'orders', 'product_stocks', 'products', 'categories', 'brands', 'users', 'warehouses'];
        for (const t of tables) await supabase.from(t).delete().not('id', 'is', null);

        // 1. БРЕНДЫ
        const { data: dbBrands } = await supabase.from('brands').insert(
            brandNames.map(b => ({ name: b, logo_url: `${STORAGE_URL}/brands/${b.webp}`, country: 'EU/Global', is_popular: true }))
        ).select();

        // 2. КАТЕГОРИИ
        const { data: dbCats } = await supabase.from('categories').insert(
            categoryNames.map((n, i) => ({ name: n, slug: `cat-${i}`, image_url: `${STORAGE_URL}/categories/${categoryImages[i]}` }))
        ).select();

        // 3. СКЛАДЫ (60 городов * 2 склада в каждом)
        const whData = [];
        cities60.forEach(city => {
            whData.push(
                { city_name: city, address: 'ул. Парковая, 5', phone: '+78000000001', is_pickup_point: true },
                { city_name: city, address: 'проспект Победы, 120', phone: '+78000000002', is_pickup_point: true }
            );
        });
        const { data: dbWarehouses } = await supabase.from('warehouses').insert(whData).select();

        // 4. ПОЛЬЗОВАТЕЛИ
        const { data: dbUsers } = await supabase.from('users').insert(
            Array.from({ length: 30 }).map((_, i) => ({
                id: `user_uuid_${i + 1}`,
                role: i === 0 ? 'admin' : 'user',
                email: `user_${i+1}@apex-auto.ru`,
                phone_number: `+7950${(i+1000000).toString().slice(1)}`,
                password_hash: 'hash_secret_123',
                first_name: `Имя${i+1}`, last_name: `Фамилия${i+1}`, otchestvo: `Отчество${i+1}`,
                avatar_url: `${STORAGE_URL}/avatars/${(i % 6) + 1}.png`,
                saved_address: `${cities60[i % 60]}, ул. Новая, д. ${i + 1}`,
                allows_data_saving: true
            }))
        ).select();

        // 5. ТОВАРЫ
        const prodsToInsert = [];
        dbCats.forEach((cat, cIdx) => {
            for (let pIdx = 0; pIdx < 3; pIdx++) {
                const brand = dbBrands[(cIdx * 3 + pIdx) % 30];
                const realName = realProductNames[cat.name][pIdx];
                prodsToInsert.push({
                    category_id: cat.id,
                    brand_id: brand.id,
                    sku: `SKU-${cat.id}-${brand.id}-${pIdx}`,
                    name: `${brand.name} ${realName}`,
                    description: getRealisticSpecs(cat.name, pIdx),
                    price: 2500 + (cIdx * 300) + (pIdx * 600),
                    weight_kg: 1.2 + pIdx,
                    image_url: `${STORAGE_URL}/products/${productImages[(cIdx * 3 + pIdx) % productImages.length]}`
                });
            }
        });
        const { data: dbProducts } = await supabase.from('products').insert(prodsToInsert).select();

        // 6. ОСТАТКИ (Минимум в 3 разных городах для каждого товара)
        console.log('📦 Заполнение остатков (3 города на товар)...');
        const stocksToInsert = [];
        dbProducts.forEach(product => {
            // Выбираем 3 случайных уникальных города из 60
            const shuffledCities = [...cities60].sort(() => 0.5 - Math.random());
            const selectedCities = shuffledCities.slice(0, 3);

            selectedCities.forEach(cityName => {
                // Находим склады в этом городе
                const warehousesInCity = dbWarehouses.filter(w => w.city_name === cityName);
                // Берем первый доступный склад в этом городе
                const targetWarehouse = warehousesInCity[0];

                stocksToInsert.push({
                    product_id: product.id,
                    warehouse_id: targetWarehouse.id,
                    quantity: Math.floor(Math.random() * 50) + 10, // от 10 до 60 шт
                    shelf_location: `S-${Math.floor(Math.random() * 99) + 1}`
                });
            });
        });
        await supabase.from('product_stocks').insert(stocksToInsert);

        // 7. ЗАКАЗЫ
        const scenarios = [{ps:'paid',ds:'delivered'},{ps:'awaiting',ds:'created'},{ps:'paid',ds:'shipping'},{ps:'unpaid',ds:'cancelled'}];
        for (const user of dbUsers) {
            for (let i = 0; i < 4; i++) {
                const p = dbProducts[Math.floor(Math.random() * dbProducts.length)];
                const { data: ord } = await supabase.from('orders').insert({
                    user_id: user.id, payment_method: 'card', payment_status: scenarios[i].ps, 
                    delivery_status: scenarios[i].ds, total_price: p.price, delivery_address: user.saved_address
                }).select().single();
                await supabase.from('order_items').insert({ order_id: ord.id, product_id: p.id, quantity: 1, unit_price: p.price });
            }
        }

        // 8. ОТЗЫВЫ
        const reviews = [];
        dbProducts.forEach(p => {
            reviews.push(
                { product_id: p.id, user_id: dbUsers[2].id, rating: 5, comment: 'Отличная деталь, подошла идеально.', pros: 'Качество, упаковка', cons: 'Не нашел', is_approved: true },
                { product_id: p.id, user_id: dbUsers[3].id, rating: 4, comment: 'Работает исправно, цена адекватная.', pros: 'Цена', cons: 'Доставка', is_approved: true }
            );
        });
        await supabase.from('reviews').insert(reviews);

        console.log('✅ Сидирование завершено! Каждый товар доступен в 3 разных городах.');
    } catch (e) {
        console.error('❌ Ошибка:', e);
    }
}

seed();