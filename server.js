const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// All other GET requests not handled before will return our index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});