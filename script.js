// ---- DATA ----
const menuData = [
  { id:1, name:"Classic Cappuccino", cat:"Coffee", desc:"Rich espresso topped with steamed milk and soft foam.", price:149, emoji:"☕" },
  { id:2, name:"Hazelnut Frappe", cat:"Coffee", desc:"Icy coffee blended with hazelnut and cream.", price:199, emoji:"🥤" },
  { id:3, name:"Mango Cooler", cat:"Mocktails", desc:"Sweet mango drink served chilled with ice.", price:129, emoji:"🥭" },
  { id:4, name:"Watermelon Fizz", cat:"Mocktails", desc:"Juicy watermelon mixed with soda and mint.", price:119, emoji:"🍉" },
  { id:5, name:"Cheezy Pizza", cat:"Snacks", desc:"Crispy base loaded with cheese, herbs and sauce.", price:249, emoji:"🍕" },
  { id:6, name:"Garlic Bread", cat:"Snacks", desc:"Golden toasted bread with garlic butter and herbs.", price:99, emoji:"🥖" },
  { id:7, name:"Loaded Fries", cat:"Snacks", desc:"Crispy fries topped with cheese, jalapeños and sauce.", price:159, emoji:"🍟" },
  { id:8, name:"Veggie Sandwich", cat:"Snacks", desc:"Fresh veggies layered in toasted multigrain bread.", price:139, emoji:"🥪" },
  { id:9, name:"Penne Arrabbiata", cat:"Mains", desc:"Penne pasta tossed in a spicy tomato sauce.", price:229, emoji:"🍝" },
  { id:10, name:"Chicken Wrap", cat:"Mains", desc:"Grilled chicken with fresh veggies in a soft wrap.", price:259, emoji:"🌯" },
  { id:11, name:"Donut Box", cat:"Desserts", desc:"Assorted soft donuts with sweet toppings.", price:179, emoji:"🍩" },
  { id:12, name:"Celebration Combo", cat:"Specials", desc:"Pizza, mocktails and dessert for a small group.", price:799, emoji:"🎉" },
];

const categories = ["All", ...new Set(menuData.map(i => i.cat))];
let activeCategory = "All";
let cart = JSON.parse(localStorage.getItem('brewnest_cart') || '[]');
let favs = new Set(JSON.parse(localStorage.getItem('brewnest_favs') || '[]'));

function saveCart() {
  localStorage.setItem('brewnest_cart', JSON.stringify(cart));
}

function saveFavs() {
  localStorage.setItem('brewnest_favs', JSON.stringify([...favs]));
}

// ---- TYPING ANIMATION ----
const phrases = ["Relaxes.", "Inspires.", "Brews Joy.", "Feels Home."];
let pIdx = 0, cIdx = 0, deleting = false;
const typingEl = document.getElementById('typingText');

function typeEffect() {
  const phrase = phrases[pIdx];
  if (!deleting) {
    typingEl.innerHTML = phrase.slice(0, cIdx + 1) + '<span class="cursor">|</span>';
    cIdx++;
    if (cIdx === phrase.length) { deleting = true; setTimeout(typeEffect, 1600); return; }
  } else {
    typingEl.innerHTML = phrase.slice(0, cIdx - 1) + '<span class="cursor">|</span>';
    cIdx--;
    if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; }
  }
  setTimeout(typeEffect, deleting ? 60 : 100);
}
typeEffect();

// ---- CATEGORY TABS ----
function renderTabs() {
  const container = document.getElementById('categoryTabs');
  container.innerHTML = categories.map(c =>
    `<button class="tab-btn ${c === activeCategory ? 'active' : ''}" onclick="setCategory('${c}')">${c}</button>`
  ).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  renderTabs();
  renderMenu();
}

// ---- MENU ----
function getQty(id) {
  const item = cart.find(i => i.id === id);
  return item ? item.qty : 0;
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const items = activeCategory === 'All' ? menuData : menuData.filter(i => i.cat === activeCategory);
  grid.innerHTML = items.map(item => {
    const qty = getQty(item.id);
    const isFav = favs.has(item.id);
    return `
    <div class="menu-card">
      <div class="menu-card-img">
        <span class="food-emoji">${item.emoji}</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(${item.id})" title="Favourite">♥</button>
      </div>
      <div class="menu-card-cat">${item.cat}</div>
      <div class="menu-card-name">${item.name}</div>
      <div class="menu-card-desc">${item.desc}</div>
      <div class="menu-card-footer">
        <span class="price">₹${item.price}</span>
        ${qty === 0
          ? `<button class="add-btn" onclick="addToCart(${item.id})">+</button>`
          : `<div class="qty-control">
              <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
              <span class="qty-num">${qty}</span>
              <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>`
        }
      </div>
    </div>`;
  }).join('');
}

function toggleFav(id) {
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  saveFavs();
  renderMenu();
}

function addToCart(id) {
  const item = menuData.find(i => i.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty++; else cart.push({ id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 });
  saveCart();
  updateCartUI();
  renderMenu();
  showToast(`${item.emoji} ${item.name} added!`);
}

function changeQty(id, delta) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart();
  updateCartUI();
  renderMenu();
  renderCartItems();
}

// ---- CART ----
function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = total;
  document.getElementById('cartHeaderCount').textContent = total > 0 ? `(${total} items)` : '';
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Your order is empty</p>
        <small>Add items from the menu</small>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartTotal').textContent = `₹${total}`;

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>`
  ).join('');
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  } else {
    renderCartItems();
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
}

// ---- ORDER ----
function placeOrder(type) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  toggleCart();
  const overlay = document.getElementById('successOverlay');
  document.getElementById('successEmoji').textContent = type === 'Parcel' ? '📦' : '🍽️';
  document.getElementById('successTitle').textContent = type === 'Parcel' ? 'Parcel Order Placed!' : 'Order Placed!';
  document.getElementById('successMsg').textContent = 
    type === 'Parcel'
    ? `Your parcel order of ₹${total} is confirmed. It'll be ready for pickup soon!`
    : `Your dine-in order of ₹${total} is placed. Enjoy your time at BrewNest! ☕`;
  overlay.classList.add('show');
  cart = [];
  saveCart();
  updateCartUI();
  renderMenu();
}

function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('show');
}

// ---- BOOK TABLE ----
function bookTable() {
  const overlay = document.getElementById('successOverlay');
  document.getElementById('successEmoji').textContent = '📅';
  document.getElementById('successTitle').textContent = 'Table Booked!';
  document.getElementById('successMsg').textContent = 'Your reservation is confirmed. We look forward to welcoming you at BrewNest!';
  overlay.classList.add('show');
}

// ---- TOAST ----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ---- INIT ----
renderTabs();
renderMenu();
updateCartUI();