const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'mush_food.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            address TEXT,
            password TEXT NOT NULL
        )`);

        // Products table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            image TEXT NOT NULL,
            description TEXT,
            category TEXT
        )`, (err) => {
            if (!err) {
                seedProducts();
            }
        });

        // Cart items table
        db.run(`CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        // Orders table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Order items table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price_at_time TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);
    });
}

function seedProducts() {
    const products = [
        ['Fresh Orange', 'KSh 159', 'image/product-1.png', 'Pixie Oranges (approx. 7 pieces per Kg)', 'fruits'],
        ['Fresh Onion', 'KSh 79', 'image/product-2.png', 'Red Onions - (appx. 10 pieces) per Kg', 'vegetables'],
        ['Fresh Meat', 'KSh 350', 'image/product-3.png', 'Meat (approx. per Kg)', 'meat'],
        ['Fresh Cabbage', 'KSh 55', 'image/product-4.png', 'White Cabbage - (appx. 1.5 head) per Kg', 'vegetables'],
        ['Fresh Potato', 'KSh 30', 'image/product-5.png', 'Baby Potatoes (appx. 20 pieces) per Kg', 'vegetables'],
        ['Fresh Avocado', 'KSh 29', 'image/product-6.png', 'Save 26% Original price KSh39', 'fruits'],
        ['Fresh Carrot', 'KSh 50', 'image/product-7.png', 'Carrots (appx. 10 pieces) per Kg', 'vegetables'],
        ['Green Lemon', 'KSh 119', 'image/product-8.png', 'green lemon', 'fruits'],
        ['Fresh Milk', 'KSh 65', 'image/cat-3.png', '1L Fresh Milk', 'dairy'],
        ['Cheddar Cheese', 'KSh 450', 'image/cat-3.png', '250g Block Cheddar', 'dairy']
    ];

    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO products (name, price, image, description, category) VALUES (?, ?, ?, ?, ?)");
            products.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log('Seeded initial products.');
        }
    });
}

module.exports = db;
