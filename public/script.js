// Mobile Menu Toggle
const bar = document.getElementById("bar");
const close = document.getElementById("close");
const nav = document.getElementById("navbar");

if (bar) {
  bar.addEventListener("click", () => {
    nav.classList.add("active");
  });
}

if (close) {
  close.addEventListener("click", () => {
    nav.classList.remove("active");
  });
}

// Cart Management System
document.addEventListener("DOMContentLoaded", function () {
  initializeCart();
  setupCartButtons();

  // If on cart page, load cart items
  if (document.querySelector("#cart tbody")) {
    loadCartItems();
    setupCartEventListeners();
  }
});

// Initialize cart in localStorage if it doesn't exist
function initializeCart() {
  if (!localStorage.getItem("cart")) {
    localStorage.setItem("cart", JSON.stringify([]));
  }
  updateCartCount();
}

// Set up event listeners for all add-to-cart buttons
function setupCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const productElement = this.closest(".pro");
      addToCart({
        id: productElement.dataset.id || generateUniqueId(productElement),
        name: productElement.querySelector("h5").textContent,
        price: parseFloat(
          productElement
            .querySelector("h4")
            .textContent.replace("₹", "")
            .replace(",", "")
        ),
        img: productElement.querySelector("img").src,
        brand: productElement.querySelector("span").textContent,
        quantity: 1,
      });
      showAddToCartNotification(productElement.querySelector("h5").textContent);
    });
  });
}

// Generate unique ID for products that don't have one
function generateUniqueId(productElement) {
  return "prod-" + Math.random().toString(36).substr(2, 9);
}

// Add item to cart or increment quantity if already exists
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart"));
  const existingIndex = cart.findIndex((item) => item.id === product.id);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push(product);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// Show notification when item is added to cart
function showAddToCartNotification(productName) {
  const notification = document.createElement("div");
  notification.className = "cart-notification";
  notification.innerHTML = `<span>${productName} added to cart!</span>`;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Update cart count in navigation
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? "inline-block" : "none";
  });
}

// Load cart items on cart page
function loadCartItems() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartBody = document.querySelector("#cart tbody");

  if (cart.length === 0) {
    cartBody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;">Your cart is empty</td></tr>';
    updateCartTotal(0);
    return;
  }

  cartBody.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const row = document.createElement("tr");
    row.dataset.id = item.id;
    row.innerHTML = `
      <td><a href="#" class="remove-item"><i class="bx bx-x-circle"></i></a></td>
      <td><img src="${item.img}" alt="${item.name}" /></td>
      <td>${item.name}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td><input type="number" value="${
        item.quantity
      }" min="1" class="quantity-input" /></td>
      <td>₹${itemTotal.toFixed(2)}</td>
    `;
    cartBody.appendChild(row);
  });

  updateCartTotal(subtotal);
}

// Set up event listeners for cart page
function setupCartEventListeners() {
  // Remove item event
  document.querySelector("#cart").addEventListener("click", function (e) {
    if (e.target.closest(".remove-item")) {
      e.preventDefault();
      const row = e.target.closest("tr");
      removeItemFromCart(row.dataset.id);
      row.remove();
      updateCartCount();
    }
  });

  // Quantity change event
  document.querySelector("#cart").addEventListener("change", function (e) {
    if (e.target.classList.contains("quantity-input")) {
      const row = e.target.closest("tr");
      updateCartItemQuantity(row.dataset.id, parseInt(e.target.value));
      updateCartDisplay();
    }
  });
}

// Remove item from cart
function removeItemFromCart(id) {
  let cart = JSON.parse(localStorage.getItem("cart"));
  cart = cart.filter((item) => item.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartDisplay();
}

// Update item quantity in cart
function updateCartItemQuantity(id, quantity) {
  let cart = JSON.parse(localStorage.getItem("cart"));
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.quantity = quantity;
    localStorage.setItem("cart", JSON.stringify(cart));
  }
}

// Update cart display (items and totals)
function updateCartDisplay() {
  loadCartItems();
  updateCartCount();
}

// Update cart totals on cart page
function updateCartTotal(subtotal) {
  const subtotalElement = document.querySelector("#subtotal table");
  const total = subtotal;

  subtotalElement.innerHTML = `
    <tr>
      <td>Cart Subtotal</td>
      <td>₹${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Shipping</td>
      <td>Free</td>
    </tr>
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>₹${total.toFixed(2)}</strong></td>
    </tr>
  `;
}
