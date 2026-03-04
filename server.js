const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

const db = require('./database');

// Middleware
app.use(bodyParser.json());
app.use(session({
    secret: 'mush-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching products' });
        }
        res.json(rows);
    });
});

// API endpoint to search products
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.json([]);
    }
    db.all("SELECT * FROM products WHERE name LIKE ? OR description LIKE ?", [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error searching products' });
        }
        res.json(rows);
    });
});

// API endpoint to get products by category
app.get('/api/products/category/:category', (req, res) => {
    const category = req.params.category;
    db.all("SELECT * FROM products WHERE category = ?", [category], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching products by category' });
        }
        res.json(rows);
    });
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
    const { email, password, name, phone, address } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (row) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)",
            [name || '', email, phone || '', address || '', hashedPassword],
            function (err) {
                if (err) return res.status(500).json({ message: 'Error creating user' });

                const userId = this.lastID;
                req.session.userId = userId;
                res.status(201).json({
                    message: 'User registered successfully',
                    user: { id: userId, email, name, phone, address }
                });
            }
        );
    });
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address
            }
        });
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Check authentication status
app.get('/api/auth', (req, res) => {
    if (req.session.userId) {
        db.get("SELECT id, email, name, phone, address FROM users WHERE id = ?", [req.session.userId], (err, user) => {
            if (err || !user) {
                return res.json({ authenticated: false });
            }
            res.json({
                authenticated: true,
                user: user
            });
        });
    } else {
        res.json({ authenticated: false });
    }
});

// User order history endpoint
app.get('/api/orders', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    db.all(`
        SELECT o.*, GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching orders' });
        res.json(rows);
    });
});

// Get user's cart
app.get('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    db.all(`
        SELECT c.*, p.name, p.price, p.image, p.description 
        FROM cart_items c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    `, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching cart' });

        const cart = rows.map(row => ({
            productId: row.product_id,
            quantity: row.quantity,
            product: {
                id: row.product_id,
                name: row.name,
                price: row.price,
                image: row.image,
                description: row.description
            }
        }));
        res.json(cart);
    });
});

// Add item to cart
app.post('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please login to add items to cart' });
    }
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err || !product) return res.status(404).json({ message: 'Product not found' });

        db.get("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?", [req.session.userId, productId], (err, item) => {
            if (item) {
                db.run("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?", [quantity, item.id], (err) => {
                    if (err) return res.status(500).json({ message: 'Error updating cart' });
                    returnCart(req, res);
                });
            } else {
                db.run("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", [req.session.userId, productId, quantity], (err) => {
                    if (err) return res.status(500).json({ message: 'Error adding to cart' });
                    returnCart(req, res);
                });
            }
        });
    });
});

// Update cart item quantity
app.put('/api/cart/:productId', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;

    if (quantity <= 0) {
        db.run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [req.session.userId, productId], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating cart' });
            returnCart(req, res);
        });
    } else {
        db.run("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?", [quantity, req.session.userId, productId], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating cart' });
            returnCart(req, res);
        });
    }
});

// Remove item from cart
app.delete('/api/cart/:productId', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const productId = parseInt(req.params.productId);

    db.run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [req.session.userId, productId], (err) => {
        if (err) return res.status(500).json({ message: 'Error removing from cart' });
        returnCart(req, res);
    });
});

// Helper to return current cart
function returnCart(req, res) {
    db.all(`
        SELECT c.*, p.name, p.price, p.image, p.description 
        FROM cart_items c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    `, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching cart' });
        const cart = rows.map(row => ({
            productId: row.product_id,
            quantity: row.quantity,
            product: {
                id: row.product_id,
                name: row.name,
                price: row.price,
                image: row.image,
                description: row.description
            }
        }));
        res.json({ message: 'Cart updated', cart });
    });
}

// Checkout endpoint
app.post('/api/checkout', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    db.all(`
        SELECT c.*, p.name, p.price, p.image, p.description 
        FROM cart_items c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    `, [req.session.userId], (err, cartItems) => {
        if (err || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        let total = 0;
        cartItems.forEach(item => {
            const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            total += price * item.quantity;
        });

        db.run("INSERT INTO orders (user_id, total_price) VALUES (?, ?)", [req.session.userId, total], function (err) {
            if (err) return res.status(500).json({ message: 'Error creating order' });

            const orderId = this.lastID;
            const stmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)");
            cartItems.forEach(item => {
                stmt.run([orderId, item.product_id, item.quantity, item.price]);
            });
            stmt.finalize();

            // Clear cart
            db.run("DELETE FROM cart_items WHERE user_id = ?", [req.session.userId], (err) => {
                res.json({
                    message: 'Checkout successful',
                    order: {
                        id: orderId,
                        total: total
                    }
                });
            });
        });
    });
});

// All other GET requests not handled before will return our index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
