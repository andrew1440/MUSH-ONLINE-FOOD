/* ==============================================
   MUSH MARKET — script.js (Redesign)
   All backend API calls preserved, new UI logic
============================================== */

// ==============================
//  TOAST NOTIFICATIONS
// ==============================
function showToast(message, type = 'success') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ==============================
//  OVERLAY & DROPDOWN SYSTEM
// ==============================
const overlay = document.getElementById('overlay');
let activeDropdown = null;

function openDropdown(id) {
    closeAllDropdowns();
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('active');
        overlay.classList.add('active');
        activeDropdown = id;
    }
}

function closeDropdown(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
    overlay.classList.remove('active');
    activeDropdown = null;
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
    overlay.classList.remove('active');
    activeDropdown = null;
}

// Close buttons inside dropdowns
document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeDropdown(btn.dataset.close));
});

// Close on overlay click
overlay.addEventListener('click', closeAllDropdowns);

// Close on scroll
window.addEventListener('scroll', closeAllDropdowns, { passive: true });

// ==============================
//  HEADER ACTIONS
// ==============================
document.getElementById('cart-btn').addEventListener('click', () => {
    const current = activeDropdown;
    closeAllDropdowns();
    if (current !== 'cart-dropdown') openDropdown('cart-dropdown');
});

document.getElementById('login-btn').addEventListener('click', () => {
    const current = activeDropdown;
    closeAllDropdowns();
    if (current !== 'login-dropdown') openDropdown('login-dropdown');
});

document.getElementById('profile-btn').addEventListener('click', () => {
    const current = activeDropdown;
    closeAllDropdowns();
    if (current !== 'profile-dropdown') openDropdown('profile-dropdown');
});

document.getElementById('wishlist-btn').addEventListener('click', () => {
    showToast('Wishlist coming soon!', 'info');
});

// Mobile menu toggle
const mobileNav = document.getElementById('mobile-nav');
document.getElementById('menu-btn').addEventListener('click', () => {
    mobileNav.classList.toggle('active');
});

// Auth form switching
document.getElementById('register-link').addEventListener('click', (e) => {
    e.preventDefault();
    closeDropdown('login-dropdown');
    openDropdown('register-dropdown');
});
document.getElementById('login-link').addEventListener('click', (e) => {
    e.preventDefault();
    closeDropdown('register-dropdown');
    openDropdown('login-dropdown');
});

// Order history button
document.getElementById('order-history-btn').addEventListener('click', () => {
    closeDropdown('profile-dropdown');
    openDropdown('order-dropdown');
    loadOrderHistory();
});

// ==============================
//  HEADER SCROLL
// ==============================
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ==============================
//  AUTH — LOGIN
// ==============================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Welcome back! 👋', 'success');
            closeDropdown('login-dropdown');
            updateUserInterface(data.user);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch {
        showToast('Network error. Try again.', 'error');
    }
});

// ==============================
//  AUTH — REGISTER
// ==============================
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('password') !== fd.get('confirm-password')) {
        showToast('Passwords do not match', 'error');
        return;
    }
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fd.get('name'),
                email: fd.get('email'),
                password: fd.get('password')
            })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Account created! Please sign in.', 'success');
            closeDropdown('register-dropdown');
            openDropdown('login-dropdown');
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch {
        showToast('Network error. Try again.', 'error');
    }
});

// ==============================
//  AUTH — UPDATE UI / LOGOUT
// ==============================
function updateUserInterface(user) {
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('profile-btn').style.display = 'flex';
    document.getElementById('profile-name').textContent = `Hi, ${user.name || 'Friend'} 👋`;
    document.getElementById('profile-email').textContent = user.email;
    loadCart();
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        document.getElementById('login-btn').style.display = 'flex';
        document.getElementById('profile-btn').style.display = 'none';
        closeAllDropdowns();
        showEmptyCartUI();
        showToast('Signed out. See you soon!', 'info');
    } catch {
        showToast('Logout failed', 'error');
    }
}
window.logout = logout;

async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.authenticated) updateUserInterface(data.user);
    } catch { }
}

// ==============================
//  CART MANAGEMENT
// ==============================
async function loadCart() {
    try {
        const res = await fetch('/api/cart');
        if (res.ok) updateCartDisplay(await res.json());
        else if (res.status === 401) showEmptyCartUI();
    } catch { }
}

function showEmptyCartUI() {
    document.getElementById('cart-empty').style.display = 'block';
    document.getElementById('cart-items').style.display = 'none';
    document.getElementById('cart-footer').style.display = 'none';
    document.getElementById('cart-count').textContent = '0';
}

function updateCartDisplay(cart) {
    const emptyEl = document.getElementById('cart-empty');
    const itemsEl = document.getElementById('cart-items');
    const footerEl = document.getElementById('cart-footer');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');

    const totalCount = cart.reduce((s, i) => s + i.quantity, 0);
    countEl.textContent = totalCount;

    if (!cart.length) {
        emptyEl.style.display = 'block';
        itemsEl.style.display = 'none';
        footerEl.style.display = 'none';
        return;
    }
    emptyEl.style.display = 'none';
    itemsEl.style.display = 'block';
    footerEl.style.display = 'block';

    let total = 0;
    itemsEl.innerHTML = cart.map(item => {
        const price = parseFloat(item.product.price.replace(/[^\d.]/g, '')) || 0;
        total += price * item.quantity;
        return `
        <div class="cart-item-row">
            <img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}" onerror="this.src='https://via.placeholder.com/60'">
            <div class="cart-item-body">
                <p class="cart-item-name">${item.product.name}</p>
                <p class="cart-item-price">${item.product.price}</p>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.productId},${item.quantity - 1})">−</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.productId},${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="cart-remove" onclick="removeFromCart(${item.productId})"><i class="fas fa-trash"></i></button>
        </div>`;
    }).join('');

    totalEl.textContent = `KSh ${total.toLocaleString()}`;
}

async function addToCart(productId) {
    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        if (res.ok) {
            const data = await res.json();
            updateCartDisplay(data.cart);
            showToast('Added to cart! 🛒', 'success');
        } else if (res.status === 401) {
            showToast('Please sign in to add items', 'info');
            openDropdown('login-dropdown');
        } else {
            const d = await res.json();
            showToast(d.message, 'error');
        }
    } catch {
        showToast('Error adding to cart', 'error');
    }
}
window.addToCart = addToCart;

async function removeFromCart(productId) {
    try {
        const res = await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
        if (res.ok) {
            const data = await res.json();
            updateCartDisplay(data.cart);
            showToast('Item removed', 'info');
        }
    } catch { }
}
window.removeFromCart = removeFromCart;

async function updateQuantity(productId, quantity) {
    if (quantity <= 0) return removeFromCart(productId);
    try {
        const res = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });
        if (res.ok) updateCartDisplay((await res.json()).cart);
    } catch { }
}
window.updateQuantity = updateQuantity;

async function checkout() {
    try {
        const res = await fetch('/api/checkout', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            showToast(`Order #${data.order.id} placed! 🎉 Total: KSh ${data.order.total}`, 'success');
            loadCart();
            closeDropdown('cart-dropdown');
        } else {
            const d = await res.json();
            showToast(d.message, 'error');
        }
    } catch {
        showToast('Checkout error. Try again.', 'error');
    }
}
document.getElementById('checkout-btn').addEventListener('click', checkout);

// ==============================
//  ORDER HISTORY
// ==============================
async function loadOrderHistory() {
    const list = document.getElementById('orders-list');
    list.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Loading orders…</p>';
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) {
            list.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Please sign in to view orders.</p>';
            return;
        }
        const orders = await res.json();
        if (!orders.length) {
            list.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">No orders yet. Start shopping!</p>';
            return;
        }
        list.innerHTML = orders.map(o => `
            <div class="order-item">
                <h4>Order #${o.id} — KSh ${Number(o.total_price).toLocaleString()}</h4>
                <p>Status: <strong style="color:var(--teal)">${o.status}</strong></p>
                <p>${new Date(o.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style="margin-top:.6rem;font-size:1.2rem;">${o.items}</p>
            </div>`).join('');
    } catch {
        list.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Failed to load orders.</p>';
    }
}

// ==============================
//  PRODUCTS — RENDER
// ==============================
let allProducts = [];
let wishlist = JSON.parse(localStorage.getItem('mush_wishlist')) || [];

function renderProductCard(product, isFlash = false) {
    const priceNum = parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
    const oldPrice = Math.round(priceNum * 1.2);
    const discount = Math.round((oldPrice - priceNum) / oldPrice * 100);
    const delivery = Math.floor(Math.random() * 26) + 20;
    const rating = (Math.random() * 1 + 4).toFixed(1);
    const isWishlisted = wishlist.includes(product.id);
    const catEmojis = { fruits: '🍊', vegetables: '🥦', meat: '🥩', dairy: '🥛' };

    return `
    <div class="product-card" data-id="${product.id}">
        ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ''}
        <div class="card-img-wrap">
            <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/200'">
        </div>
        <div class="card-body">
            <p class="card-category">${catEmojis[product.category] || '🛒'} ${product.category || 'Fresh'}</p>
            <h3 class="card-name">${product.name}</h3>
            <p class="card-desc">${product.description || ''}</p>
            <div class="card-meta">
                <span class="card-delivery"><i class="fas fa-motorcycle"></i>${delivery} min</span>
                <span class="card-rating"><i class="fas fa-star"></i>${rating}</span>
            </div>
            <div class="card-footer">
                <div class="card-price">
                    <span class="card-current-price">${product.price}</span>
                    <span class="card-old-price">KSh ${oldPrice}</span>
                </div>
                <div class="card-actions">
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                    <button class="wishlist-btn-card ${isWishlisted ? 'wishlisted' : ''}" onclick="toggleWishlist(${product.id},this)">
                        <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function renderProducts(products, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!products.length) {
        el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)"><div style="font-size:4rem">🔍</div><p>No products found</p></div>`;
        return;
    }
    el.innerHTML = products.map(p => renderProductCard(p, containerId === 'flash-products')).join('');
}

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        allProducts = await res.json();
        renderProducts(allProducts, 'products-grid');
        renderProducts(allProducts.slice(0, 4), 'flash-products');
        startFlashTimer();
        initSwipers();
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// ==============================
//  CATEGORY FILTER
// ==============================
window.filterCategory = async function (cat, cardEl) {
    // Update active card UI
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    if (cardEl) cardEl.classList.add('active');

    const heading = document.getElementById('products-heading');
    if (cat === 'all') {
        renderProducts(allProducts, 'products-grid');
        heading.innerHTML = 'Recommended <span>For You</span>';
    } else {
        try {
            const res = await fetch(`/api/products/category/${cat}`);
            const products = await res.json();
            renderProducts(products, 'products-grid');
            heading.innerHTML = `Shop <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>`;
        } catch { }
    }
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
};

// Also expose loadCategoryProducts for backward compat
window.loadCategoryProducts = (cat) => filterCategory(cat, null);

// ==============================
//  SEARCH
// ==============================
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = document.getElementById('search-box').value.trim();
    if (!q) return;
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const products = await res.json();
        renderProducts(products, 'products-grid');
        document.getElementById('products-heading').innerHTML = `Results for <span>"${q}"</span>`;
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    } catch { }
});

// ==============================
//  WISHLIST
// ==============================
function toggleWishlist(id, btn) {
    const idx = wishlist.indexOf(id);
    if (idx === -1) {
        wishlist.push(id);
        showToast('Added to wishlist ❤️', 'success');
        if (btn) { btn.classList.add('wishlisted'); btn.innerHTML = '<i class="fas fa-heart"></i>'; }
    } else {
        wishlist.splice(idx, 1);
        showToast('Removed from wishlist', 'info');
        if (btn) { btn.classList.remove('wishlisted'); btn.innerHTML = '<i class="far fa-heart"></i>'; }
    }
    localStorage.setItem('mush_wishlist', JSON.stringify(wishlist));
    document.getElementById('wishlist-count').textContent = wishlist.length;
}
window.toggleWishlist = toggleWishlist;

// ==============================
//  FLASH TIMER
// ==============================
function startFlashTimer() {
    let h = 2, m = 45, s = 0;
    const hEl = document.getElementById('hours');
    const mEl = document.getElementById('minutes');
    const sEl = document.getElementById('seconds');
    if (!hEl) return;

    setInterval(() => {
        if (s > 0) s--;
        else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }

        hEl.textContent = String(h).padStart(2, '0');
        mEl.textContent = String(m).padStart(2, '0');
        sEl.textContent = String(s).padStart(2, '0');
    }, 1000);
}

// ==============================
//  SWIPER INIT
// ==============================
function initSwipers() {
    new Swiper('.hero-swiper', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        speed: 900,
        pagination: { el: '.hero-pagination', clickable: true }
    });
    new Swiper('.reviews-swiper', {
        loop: true,
        autoplay: { delay: 4500 },
        speed: 700,
        spaceBetween: 20,
        pagination: { el: '.reviews-pagination', clickable: true },
        breakpoints: {
            0: { slidesPerView: 1 },
            650: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
        }
    });
}

// ==============================
//  ANIMATED STAT COUNTERS
// ==============================
function animateCounters() {
    document.querySelectorAll('.stat-num').forEach(el => {
        const target = +el.dataset.target;
        let current = 0;
        const step = target / 60;
        const update = () => {
            current = Math.min(current + step, target);
            el.textContent = Math.floor(current).toLocaleString() + (target >= 1000 ? '+' : '');
            if (current < target) requestAnimationFrame(update);
        };
        update();
    });
}

// Observe hero section for counter
const heroObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounters(); heroObs.disconnect(); } });
}, { threshold: 0.4 });
const heroEl = document.getElementById('hero');
if (heroEl) heroObs.observe(heroEl);

// ==============================
//  VIEW TOGGLE (Grid / List)
// ==============================
document.getElementById('grid-view-btn').addEventListener('click', function () {
    document.getElementById('products-grid').classList.remove('list-layout');
    this.classList.add('active');
    document.getElementById('list-view-btn').classList.remove('active');
});
document.getElementById('list-view-btn').addEventListener('click', function () {
    document.getElementById('products-grid').classList.add('list-layout');
    this.classList.add('active');
    document.getElementById('grid-view-btn').classList.remove('active');
});

// ==============================
//  INIT
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadProducts();
    document.getElementById('wishlist-count').textContent = wishlist.length;
});
