const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(session({
  secret: 'mush-secret-key',
  resave: false,
  saveUninitialized: false
}));

// In-memory user storage (in production, use a database)
const users = [];

// In-memory cart storage per user session
const carts = {};

// Mock product data (in a real app, this would come from a database)
const products = [
    { id: 1, name: 'Fresh Orange', price: 'KSh159', image: 'image/product-1.png', description: 'Pixie Oranges (approx. 7 pieces per Kg)' },
    { id: 2, name: 'Fresh Onion', price: 'KSh79', image: 'image/product-2.png', description: 'Red Onions - (appx. 10 pieces) per Kg' },
    { id: 3, name: 'Fresh Meat', price: 'KSh 300 to ksh 400', image: 'image/product-3.png', description: 'Meat (approx. per Kg)' },
    { id: 4, name: 'Fresh Cabbage', price: 'KSh55', image: 'image/product-4.png', description: 'White Cabbage - (appx. 1.5 head) per Kg' },
    { id: 5, name: 'Fresh Potato', price: 'from KSh 30', image: 'image/product-5.png', description: 'Baby Potatoes (appx. 20 pieces) per Kg' },
    { id: 6, name: 'Fresh Avocado', price: 'KSh29', image: 'image/product-6.png', description: 'Save 26% Original price KSh39' },
    { id: 7, name: 'Fresh Carrot', price: 'KSh 50', image: 'image/product-7.png', description: 'Carrots (appx. 10 pieces) per Kg' },
    { id: 8, name: 'Green Lemon', price: 'KSh 119', image: 'image/product-8.png', description: 'green lemon' }
];

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
    const { email, password, name, phone, address } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        email,
        password: hashedPassword,
        name: name || '',
        phone: phone || '',
        address: address || ''
    };
    users.push(newUser);
    req.session.userId = newUser.id;
    // Initialize empty cart for new user
    carts[newUser.id] = [];
    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            phone: newUser.phone,
            address: newUser.address
        }
    });
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = users.find(user => user.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    // Initialize cart if it doesn't exist
    if (!carts[user.id]) {
        carts[user.id] = [];
    }
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
        const user = users.find(u => u.id === req.session.userId);
        if (user) {
            return res.json({
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    address: user.address
                }
            });
        }
    }
    res.json({ authenticated: false });
});

// Get user's cart
app.get('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const userCart = carts[req.session.userId] || [];
    res.json(userCart);
});

// Add item to cart
app.post('/api/cart', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (!carts[req.session.userId]) {
        carts[req.session.userId] = [];
    }

    const userCart = carts[req.session.userId];
    const existingItem = userCart.find(item => item.productId === parseInt(productId));

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        userCart.push({
            productId: parseInt(productId),
            quantity: quantity,
            product: product
        });
    }

    res.json({ message: 'Item added to cart', cart: userCart });
});

// Update cart item quantity
app.put('/api/cart/:productId', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;

    if (!carts[req.session.userId]) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const userCart = carts[req.session.userId];
    const item = userCart.find(item => item.productId === productId);

    if (!item) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const index = userCart.indexOf(item);
        userCart.splice(index, 1);
    } else {
        item.quantity = quantity;
    }

    res.json({ message: 'Cart updated', cart: userCart });
});

// Remove item from cart
app.delete('/api/cart/:productId', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const productId = parseInt(req.params.productId);

    if (!carts[req.session.userId]) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const userCart = carts[req.session.userId];
    const itemIndex = userCart.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    userCart.splice(itemIndex, 1);
    res.json({ message: 'Item removed from cart', cart: userCart });
});

// Checkout endpoint
app.post('/api/checkout', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const userCart = carts[req.session.userId] || [];
    if (userCart.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total
    let total = 0;
    userCart.forEach(item => {
        const price = parseFloat(item.product.price.replace(/[^\d.]/g, ''));
        total += price * item.quantity;
    });

    // Here you would typically process payment and create an order
    // For now, we'll just clear the cart and return success
    carts[req.session.userId] = [];

    res.json({
        message: 'Checkout successful',
        order: {
            id: Date.now(), // Simple order ID
            items: userCart,
            total: total,
            customer: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        }
    });
});

// All other GET requests not handled before will return our index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});