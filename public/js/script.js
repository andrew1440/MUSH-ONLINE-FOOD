let searchForm = document.querySelector('.search-form');

document.querySelector('#search-btn').onclick = () => {
    searchForm.classList.toggle('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}

let shoppingCart = document.querySelector('.shopping-cart');

document.querySelector('#cart-btn').onclick = () => {
    shoppingCart.classList.toggle('active');
    searchForm.classList.remove('active');
    loginForm.classList.remove('active');
    navbar.classList.remove('active');
}

let loginForm = document.querySelector('.login-form');
let registerForm = document.querySelector('.register-form');
let userProfile = document.querySelector('.user-profile');

document.querySelector('#login-btn').onclick = () => {
    loginForm.classList.toggle('active');
    registerForm.classList.remove('active');
    userProfile.classList.remove('active');
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    navbar.classList.remove('active');
}

document.querySelector('#profile-btn').onclick = () => {
    userProfile.classList.toggle('active');
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    navbar.classList.remove('active');
}

let navbar = document.querySelector('.navbar');

document.querySelector('#menu-btn').onclick = () => {
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    userProfile.classList.remove('active');
}

// Handle register link
document.querySelector('#register-link').onclick = (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
}

// Handle login link
document.querySelector('#login-link').onclick = (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
}

// Handle login form submission
document.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Login successful!');
            loginForm.classList.remove('active');
            updateUserInterface(data.user);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Login failed');
    }
});

// Handle register form submission
document.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const address = formData.get('address');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, address, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Registration failed');
    }
});

window.onscroll = () => {
    searchForm.classList.remove('active');
    shoppingCart.classList.remove('active');
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    userProfile.classList.remove('active');
    navbar.classList.remove('active');
}

// Cart management functions
async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        if (response.ok) {
            const cart = await response.json();
            updateCartDisplay(cart);
        } else if (response.status === 401) {
            // User not authenticated
            showEmptyCart();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function updateCartDisplay(cart) {
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItems.style.display = 'none';
        cartTotal.style.display = 'none';
        checkoutBtn.style.display = 'none';
        return;
    }

    cartEmpty.style.display = 'none';
    cartItems.style.display = 'block';
    cartTotal.style.display = 'block';
    checkoutBtn.style.display = 'block';

    // Clear existing items
    cartItems.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'box';

        const price = parseFloat(item.product.price.replace(/[^\d.]/g, ''));
        const itemTotal = price * item.quantity;
        total += itemTotal;

        itemDiv.innerHTML = `
            <i class="fas fa-trash" onclick="removeFromCart(${item.productId})"></i>
            <img src="${item.product.image}" alt="${item.product.name}">
            <div class="content">
                <h3>${item.product.name}</h3>
                <span class="price">${item.product.price}</span>
                <span class="quantity">
                    <button onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                    qty: ${item.quantity}
                    <button onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                </span>
            </div>
        `;

        cartItems.appendChild(itemDiv);
    });

    cartTotal.textContent = `Total: KSh ${total}/-`;
}

function showEmptyCart() {
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    cartEmpty.style.display = 'block';
    cartItems.style.display = 'none';
    cartTotal.style.display = 'none';
    checkoutBtn.style.display = 'none';
}

async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.ok) {
            const data = await response.json();
            updateCartDisplay(data.cart);
            alert('Item added to cart!');
        } else if (response.status === 401) {
            alert('Please login to add items to cart');
            loginForm.classList.add('active');
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Error adding item to cart');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            updateCartDisplay(data.cart);
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Error removing item from cart');
    }
}

async function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });

        if (response.ok) {
            const data = await response.json();
            updateCartDisplay(data.cart);
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Error updating cart');
    }
}

async function checkout() {
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Checkout successful! Order ID: ${data.order.id}\nTotal: KSh ${data.order.total}/-`);
            loadCart(); // Refresh cart display
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Error during checkout');
    }
}

// Update user interface when logged in
function updateUserInterface(user) {
    // Hide login button, show profile button
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('profile-btn').style.display = 'inline-block';

    // Populate profile info
    document.getElementById('profile-name').textContent = `Welcome, ${user.name || 'User'}!`;
    document.getElementById('profile-email').textContent = `Email: ${user.email}`;
    document.getElementById('profile-phone').textContent = `Phone: ${user.phone || 'Not provided'}`;
    document.getElementById('profile-address').textContent = `Address: ${user.address || 'Not provided'}`;

    // Load user's cart
    loadCart();
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        if (response.ok) {
            // Reset UI
            document.getElementById('login-btn').style.display = 'inline-block';
            document.getElementById('profile-btn').style.display = 'none';
            userProfile.classList.remove('active');
            showEmptyCart();
            alert('Logged out successfully!');
        } else {
            alert('Logout failed');
        }
    } catch (error) {
        alert('Logout failed');
    }
}

// Check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth');
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                updateUserInterface(data.user);
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Product management functions
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.ok) {
            const products = await response.json();
            renderProducts(products, 'recommended-products');
            renderFlashSales(products.slice(0, 4)); // Mock flash sales with first 4 products
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    products.forEach(product => {
        const oldPrice = calculateOldPrice(product.price);
        const discount = Math.round((parseFloat(oldPrice.replace(/[^\d.]/g, '')) - parseFloat(product.price.replace(/[^\d.]/g, ''))) / parseFloat(oldPrice.replace(/[^\d.]/g, '')) * 100);

        const card = document.createElement('div');
        card.className = containerId === 'flash-products' ? 'product-card' : 'swiper-slide product-card';
        card.innerHTML = `
            ${discount > 0 ? `<div class="badge">-${discount}%</div>` : ''}
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="price-container">
                <span class="current-price">${product.price}</span>
                <span class="old-price">${oldPrice}</span>
            </div>
            <div class="stars">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn" style="flex: 1; padding: .6rem;" onclick="addToCart(${product.id})">ADD TO CART</button>
                <button class="btn" style="background: none; border: 1px solid var(--primary); color: var(--primary); padding: .6rem;" onclick="toggleWishlist(${product.id})">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    if (containerId === 'recommended-products') {
        initializeSwipers();
    }
}

function calculateOldPrice(currentPrice) {
    const price = parseFloat(currentPrice.replace(/[^\d.]/g, ''));
    if (isNaN(price)) return currentPrice;
    return `KSh ${Math.round(price * 1.2)}`; // Mocked 20% higher old price
}

function renderFlashSales(products) {
    renderProducts(products, 'flash-products');
    startFlashTimer();
}

function startFlashTimer() {
    let hours = 2, minutes = 45, seconds = 0;
    const hElem = document.getElementById('hours');
    const mElem = document.getElementById('minutes');
    const sElem = document.getElementById('seconds');

    if (!hElem) return;

    const timer = setInterval(() => {
        if (seconds > 0) seconds--;
        else {
            if (minutes > 0) { minutes--; seconds = 59; }
            else {
                if (hours > 0) { hours--; minutes = 59; seconds = 59; }
                else clearInterval(timer);
            }
        }
        hElem.textContent = String(hours).padStart(2, '0');
        mElem.textContent = String(minutes).padStart(2, '0');
        sElem.textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// Wishlist Logic
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index === -1) {
        wishlist.push(productId);
        alert('Added to Wishlist!');
    } else {
        wishlist.splice(index, 1);
        alert('Removed from Wishlist');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

function updateWishlistCount() {
    const countElem = document.querySelector('#wishlist-btn span');
    if (countElem) countElem.textContent = wishlist.length;
}

// Override updateCartDisplay to update count
const originalUpdateCartDisplay = updateCartDisplay;
updateCartDisplay = function (cart) {
    originalUpdateCartDisplay(cart);
    const countElem = document.querySelector('#cart-btn span');
    if (countElem) countElem.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
};

let heroSwiper, productSwiper;

function initializeSwipers() {
    if (heroSwiper) heroSwiper.destroy();
    heroSwiper = new Swiper(".hero-slider", {
        loop: true,
        autoplay: { delay: 3000 },
        speed: 1000,
    });

    if (productSwiper) {
        if (Array.isArray(productSwiper)) productSwiper.forEach(s => s.destroy());
        else productSwiper.destroy();
    }

    productSwiper = new Swiper(".product-slider", {
        loop: true,
        spaceBetween: 10,
        autoplay: { delay: 5000 },
        breakpoints: {
            0: { slidesPerView: 1.5 },
            768: { slidesPerView: 3.5 },
            1020: { slidesPerView: 5.5 },
        },
    });
}

// Handle search form submission
if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.querySelector('#search-box').value;
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const products = await response.json();
                renderProducts(products, 'recommended-products');
                document.querySelector('#products').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    });
}

// Load everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadProducts();
    updateWishlistCount();
});

// Handle checkout button click
document.getElementById('checkout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    checkout();
});
