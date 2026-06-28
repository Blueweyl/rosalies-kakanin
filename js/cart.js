/* ============================================
   ROSALIE'S KAKANIN — Cart & Checkout System
   localStorage-backed cart with modal + checkout
   ============================================ */

(function () {
  'use strict';

  /* ---------- Cart State ---------- */
  const STORAGE_KEY = 'rosalies_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function clearCart() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ---------- Price parser ---------- */
  function parseBasePrice(priceText) {
    // Extract the first number that appears after a peso sign (₱)
    // The rendered text uses the actual ₱ character
    const cleaned = priceText.replace(/,/g, '');
    // First try: number right after ₱
    const pesoMatch = cleaned.match(/₱\s*(\d+)/);
    if (pesoMatch) return parseInt(pesoMatch[1], 10);
    // Fallback: first standalone number
    const fallback = cleaned.match(/(\d+)/);
    return fallback ? parseInt(fallback[1], 10) : 0;
  }

  /* ---------- Cart operations ---------- */
  function addToCart(name, price) {
    const cart = getCart();
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, price: price, qty: 1 });
    }
    saveCart(cart);
    updateCartUI();
    showAddedFeedback(name);
  }

  function updateQty(name, delta) {
    const cart = getCart();
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      const idx = cart.indexOf(item);
      cart.splice(idx, 1);
    }
    saveCart(cart);
    updateCartUI();
  }

  function removeItem(name) {
    const cart = getCart().filter(i => i.name !== name);
    saveCart(cart);
    updateCartUI();
  }

  function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  /* ---------- Feedback toast ---------- */
  function showAddedFeedback(name) {
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = name + ' added to cart';
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  /* ---------- Sticky Cart Bar ---------- */
  function createStickyBar() {
    if (document.getElementById('cart-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'cart-bar';
    bar.innerHTML =
      '<div class="cart-bar-inner">' +
        '<div class="cart-bar-info">' +
          '<span class="cart-bar-icon">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
              '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' +
            '</svg>' +
          '</span>' +
          '<span class="cart-bar-count">0 items</span>' +
          '<span class="cart-bar-dot">&middot;</span>' +
          '<span class="cart-bar-total">' + "₱" + '0</span>' +
        '</div>' +
        '<button class="cart-bar-btn" onclick="RosaliesCart.openModal()">View cart</button>' +
      '</div>';
    document.body.appendChild(bar);
  }

  /* ---------- Cart Modal ---------- */
  function createModal() {
    if (document.getElementById('cart-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cart-modal';
    overlay.innerHTML =
      '<div class="cart-modal-backdrop" onclick="RosaliesCart.closeModal()"></div>' +
      '<div class="cart-modal-drawer">' +
        '<div class="cart-modal-header">' +
          '<h3>Your Cart</h3>' +
          '<button class="cart-modal-close" onclick="RosaliesCart.closeModal()">&times;</button>' +
        '</div>' +
        '<div class="cart-modal-body" id="cart-modal-body"></div>' +
        '<div class="cart-modal-footer" id="cart-modal-footer"></div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function openModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    renderModalItems();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderModalItems() {
    const body = document.getElementById('cart-modal-body');
    const footer = document.getElementById('cart-modal-footer');
    const cart = getCart();

    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<p>Your cart is empty</p>' +
          '<p class="cart-empty-sub">Browse the menu and add some kakanin!</p>' +
        '</div>';
      footer.innerHTML = '';
      return;
    }

    let html = '';
    cart.forEach(function (item) {
      html +=
        '<div class="cart-item">' +
          '<div class="cart-item-swatch"></div>' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.name + '</div>' +
            '<div class="cart-item-price">' + "₱" + item.price.toLocaleString() + '</div>' +
          '</div>' +
          '<div class="cart-item-controls">' +
            '<button class="qty-btn" onclick="RosaliesCart.updateQty(\'' + item.name.replace(/'/g, "\\'") + '\', -1)">&minus;</button>' +
            '<span class="qty-num">' + item.qty + '</span>' +
            '<button class="qty-btn" onclick="RosaliesCart.updateQty(\'' + item.name.replace(/'/g, "\\'") + '\', 1)">+</button>' +
          '</div>' +
          '<div class="cart-item-subtotal">' + "₱" + (item.price * item.qty).toLocaleString() + '</div>' +
        '</div>';
    });
    body.innerHTML = html;

    var total = getCartTotal();
    footer.innerHTML =
      '<div class="cart-footer-row">' +
        '<span>Subtotal</span>' +
        '<span class="cart-footer-total">' + "₱" + total.toLocaleString() + '</span>' +
      '</div>' +
      '<a href="checkout.html" class="cart-checkout-btn">Go to checkout</a>' +
      '<button class="cart-clear-btn" onclick="RosaliesCart.doClear()">Clear cart</button>';
  }

  function doClear() {
    clearCart();
    updateCartUI();
    closeModal();
  }

  /* ---------- UI Sync ---------- */
  function updateCartUI() {
    var count = getCartCount();
    var total = getCartTotal();
    var bar = document.getElementById('cart-bar');

    if (bar) {
      if (count > 0) {
        bar.classList.add('visible');
      } else {
        bar.classList.remove('visible');
      }
      var countEl = bar.querySelector('.cart-bar-count');
      var totalEl = bar.querySelector('.cart-bar-total');
      if (countEl) countEl.textContent = count + (count === 1 ? ' item' : ' items');
      if (totalEl) totalEl.textContent = "₱" + total.toLocaleString();
    }

    // Re-render modal if it's open
    var modal = document.getElementById('cart-modal');
    if (modal && modal.classList.contains('open')) {
      renderModalItems();
    }

    // Update checkout page if present
    if (typeof renderCheckoutSummary === 'function') {
      renderCheckoutSummary();
    }
  }

  /* ---------- Inject Add buttons into menu cards ---------- */
  function initMenuButtons() {
    var cards = document.querySelectorAll('.menu-card');
    cards.forEach(function (card) {
      var bodyEl = card.querySelector('.body');
      if (!bodyEl) return;

      var h3 = bodyEl.querySelector('h3');
      var priceEl = bodyEl.querySelector('.price');
      if (!h3 || !priceEl) return;

      var name = h3.textContent.trim();
      var price = parseBasePrice(priceEl.textContent);

      // Store data on the card
      card.setAttribute('data-product', name);
      card.setAttribute('data-price', price);

      // Create Add button
      var btn = document.createElement('button');
      btn.className = 'add-to-cart-btn';
      btn.textContent = 'Add';
      btn.setAttribute('aria-label', 'Add ' + name + ' to cart');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        addToCart(name, price);
      });

      bodyEl.appendChild(btn);
    });
  }

  /* ---------- Init ---------- */
  function init() {
    createStickyBar();
    createModal();
    initMenuButtons();
    updateCartUI();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- Checkout page helpers ---------- */
  // Exposed globally for checkout.html to use
  window.RosaliesCart = {
    getCart: getCart,
    saveCart: saveCart,
    clearCart: clearCart,
    getCartTotal: getCartTotal,
    getCartCount: getCartCount,
    addToCart: addToCart,
    updateQty: updateQty,
    removeItem: removeItem,
    openModal: openModal,
    closeModal: closeModal,
    doClear: doClear,
    updateCartUI: updateCartUI,
    parseBasePrice: parseBasePrice
  };

})();
