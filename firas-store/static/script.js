// ============================================
// FIRAS STORE - Cart & UI Logic
// ============================================

const CART_STORAGE_KEY = 'firas_cart';

// --- Size Guide Modal ---

function openSizeGuide() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeSizeGuide(event) {
    // If called with no args (e.g. from X button), close immediately
    if (!event) {
        const modal = document.getElementById('size-guide-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
        return;
    }
    // If called from overlay click, ensure we clicked the overlay itself
    if (event.target && event.target.id === 'size-guide-modal') {
        const modal = document.getElementById('size-guide-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('size-guide-modal');
        if (modal && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
});

// --- Cart Core Functions ---

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(id, name, price, image, size, color) {
    const cart = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1, size: size || 'L', color: color || 'Black' });
    }
    saveCart(cart);
    renderCart();
    updateCartCount();
    openCart();
}

function addToCartFromButton(btn) {
    const id = parseInt(btn.dataset.id);
    const name = btn.dataset.name;
    const price = parseInt(btn.dataset.price);
    const image = btn.dataset.image;
    const sizeSelect = document.getElementById('order-size');
    const colorSelect = document.getElementById('order-color');
    const size = sizeSelect ? sizeSelect.value : 'L';
    const color = colorSelect ? colorSelect.value : 'Black';
    addToCart(id, name, price, image, size, color);
}

function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    renderCart();
    updateCartCount();
}

function updateQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }
    saveCart(cart);
    renderCart();
    updateCartCount();
}

function getCartTotal() {
    return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// --- Cart UI ---

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    } else {
        openCart();
    }
}

function openCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    sidebar.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

function updateCartCount() {
    const count = getCartCount();
    const badge = document.getElementById('cart-badge');
    const headerCount = document.getElementById('cart-count-header');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    if (headerCount) {
        headerCount.textContent = count + (count === 1 ? ' item' : ' items');
    }
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    const footer = document.getElementById('cart-footer');
    const totalPrice = document.getElementById('cart-total-price');

    if (cart.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        if (footer) footer.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    if (footer) footer.style.display = 'block';

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="/static/${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <span class="cart-item-price">${item.price} DZD</span>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)" aria-label="Decrease quantity">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)" aria-label="Increase quantity">+</button>
                </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remove item">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');

    if (totalPrice) {
        totalPrice.textContent = getCartTotal().toLocaleString() + ' DZD';
    }
}

// --- Navbar Scroll Effect ---

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// --- Scroll Reveal ---

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

// --- Smooth Scroll Offset ---

function initSmoothScrollOffset() {
    document.querySelectorAll('a[href^="#"], a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') || (href.includes('#') && !href.startsWith('http'))) {
                const targetId = href.split('#')[1];
                const target = document.getElementById(targetId);
                if (target) {
                    e.preventDefault();
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// --- Language Logic ---

function changeLanguage(lang) {
    localStorage.setItem('lang', lang);
    if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
        const formTitle = document.getElementById('form-title');
        if (formTitle) formTitle.innerText = 'تفاصيل الطلب';
    } else {
        document.documentElement.dir = 'ltr';
        const formTitle = document.getElementById('form-title');
        if (formTitle) formTitle.innerText = 'Order Details';
    }
}

// --- WhatsApp Order Logic (fallback) ---

function sendOrder() {
    const name = document.getElementById('cust-name')?.value;
    const phone = document.getElementById('cust-phone')?.value;
    const address = document.getElementById('cust-addr')?.value;
    const product = document.getElementById('p-name')?.innerText;
    const size = document.getElementById('order-size')?.value;
    const color = document.getElementById('order-color')?.value;

    if (!name || !phone) {
        alert("Please fill in your name and phone number");
        return;
    }

    const text = encodeURIComponent(
        `Hello! I'd like to place an order:\n` +
        `Product: ${product}\n` +
        `Size: ${size}\n` +
        `Color: ${color}\n` +
        `Customer: ${name}\n` +
        `Phone: ${phone}` +
        (address ? `\nAddress: ${address}` : '')
    );

    window.open(`https://wa.me/213657744371?text=${text}`, '_blank');
}

// --- Init Page ---

document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroll();
    initScrollReveal();
    initSmoothScrollOffset();
    renderCart();
    updateCartCount();
    if (localStorage.getItem('lang')) changeLanguage(localStorage.getItem('lang'));
});
