/**
 * AJAX Cart functionality for Shopify theme
 * Handles adding products to cart, updating quantities, and cart drawer
 */

class CartManager {
  constructor() {
    this.cart = null;
    this.cartDrawer = null;
    this.stickyCart = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadCart();
    this.initStickyCart();
  }

  bindEvents() {
    // Add to cart forms
    document.addEventListener("submit", (e) => {
      if (e.target.matches('form[action*="/cart/add"]')) {
        e.preventDefault();
        this.addToCart(e.target);
      }
    });

    // Cart drawer toggle
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-cart-toggle]")) {
        e.preventDefault();
        this.toggleCartDrawer();
      }
    });

    // Close cart drawer
    document.addEventListener("click", (e) => {
      if (
        e.target.matches("[data-cart-close]") ||
        e.target.matches(".cart-drawer-backdrop")
      ) {
        this.closeCartDrawer();
      }
    });

    // Update cart quantities
    document.addEventListener("change", (e) => {
      if (e.target.matches("[data-cart-quantity]")) {
        this.updateCartQuantity(e.target);
      }
    });

    // Remove cart items
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-cart-remove]")) {
        e.preventDefault();
        this.removeFromCart(e.target);
      }
    });

    // Scroll detection for sticky cart
    window.addEventListener("scroll", () => {
      this.handleScroll();
    });
  }

  async addToCart(form) {
    const formData = new FormData(form);
    const addButton = form.querySelector('button[type="submit"]');
    const originalText = addButton.textContent;

    // Show loading state
    addButton.disabled = true;
    addButton.innerHTML =
      '<span class="loading loading-spinner loading-sm"></span> Adding...';

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const product = await response.json();
        await this.loadCart();
        this.showSuccessMessage(product);
        this.animateStickyCart();
        this.openCartDrawer();
      } else {
        const error = await response.json();
        this.showErrorMessage(
          error.description || "Failed to add product to cart"
        );
      }
    } catch (error) {
      console.error("Cart error:", error);
      this.showErrorMessage("Network error. Please try again.");
    } finally {
      // Reset button state
      addButton.disabled = false;
      addButton.textContent = originalText;
    }
  }

  async loadCart() {
    try {
      const response = await fetch("/cart.js");
      this.cart = await response.json();
      this.updateCartUI();
    } catch (error) {
      console.error("Failed to load cart:", error);
    }
  }

  async updateCartQuantity(input) {
    const line = parseInt(input.dataset.cartLine);
    const quantity = parseInt(input.value);

    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: line,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        await this.loadCart();
      } else {
        // Revert input value on error
        input.value = input.dataset.originalValue;
        this.showErrorMessage("Failed to update quantity");
      }
    } catch (error) {
      console.error("Update cart error:", error);
      input.value = input.dataset.originalValue;
      this.showErrorMessage("Network error. Please try again.");
    }
  }

  async removeFromCart(button) {
    const line = parseInt(button.dataset.cartLine);

    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: line,
          quantity: 0,
        }),
      });

      if (response.ok) {
        await this.loadCart();
        this.showSuccessMessage("Item removed from cart");
      } else {
        this.showErrorMessage("Failed to remove item");
      }
    } catch (error) {
      console.error("Remove from cart error:", error);
      this.showErrorMessage("Network error. Please try again.");
    }
  }

  updateCartUI() {
    // Update cart count in header
    const cartCount = document.querySelector("[data-cart-count]");
    if (cartCount) {
      cartCount.textContent = this.cart.item_count;
      cartCount.style.display = this.cart.item_count > 0 ? "block" : "none";
    }

    // Update cart drawer content
    this.updateCartDrawer();
    
    // Update sticky cart
    this.updateStickyCart();
  }

  updateCartDrawer() {
    const cartDrawer = document.querySelector(".cart-drawer");
    if (!cartDrawer) return;

    const cartItems = cartDrawer.querySelector(".cart-items");
    const cartTotal = cartDrawer.querySelector(".cart-total");
    const cartEmpty = cartDrawer.querySelector(".cart-empty");

    if (this.cart.item_count === 0) {
      cartItems.style.display = "none";
      cartEmpty.style.display = "block";
      cartTotal.style.display = "none";
    } else {
      cartItems.style.display = "block";
      cartEmpty.style.display = "none";
      cartTotal.style.display = "block";

      // Update cart items
      cartItems.innerHTML = this.cart.items
        .map(
          (item) => `
        <div class="cart-item flex items-center gap-4 p-4 border-b border-base-300">
          <div class="w-16 h-16 bg-base-200 rounded-lg overflow-hidden">
            <img src="${item.image}" alt="${
            item.title
          }" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-sm">${item.product_title}</h4>
            <p class="text-xs text-base-content/70">${item.variant_title}</p>
            <p class="text-sm font-bold text-primary">${this.formatMoney(
              item.price
            )}</p>
          </div>
          <div class="flex items-center gap-2">
            <input 
              type="number" 
              value="${item.quantity}" 
              min="1" 
              class="input input-sm w-16 text-center"
              data-cart-quantity
              data-cart-line="${item.index + 1}"
              data-original-value="${item.quantity}"
            >
            <button 
              class="btn btn-sm btn-error btn-circle"
              data-cart-remove
              data-cart-line="${item.index + 1}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      `
        )
        .join("");

      // Update cart total
      cartTotal.innerHTML = `
        <div class="flex justify-between items-center p-4 border-t border-base-300">
          <span class="text-lg font-bold">Total:</span>
          <span class="text-lg font-bold text-primary">${this.formatMoney(
            this.cart.total_price
          )}</span>
        </div>
        <div class="p-4">
          <a href="/cart" class="btn btn-outline w-full mb-2">View Cart</a>
          <a href="/checkout" class="btn btn-primary w-full">Checkout</a>
        </div>
      `;
    }
  }

  toggleCartDrawer() {
    const cartDrawer = document.querySelector(".cart-drawer");
    if (!cartDrawer) return;

    if (cartDrawer.classList.contains("open")) {
      this.closeCartDrawer();
    } else {
      this.openCartDrawer();
    }
  }

  openCartDrawer() {
    const cartDrawer = document.querySelector(".cart-drawer");
    if (!cartDrawer) return;

    cartDrawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  closeCartDrawer() {
    const cartDrawer = document.querySelector(".cart-drawer");
    if (!cartDrawer) return;

    cartDrawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  showSuccessMessage(message) {
    this.showToast(message, "success");
  }

  showErrorMessage(message) {
    this.showToast(message, "error");
  }

  showToast(message, type = "info") {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-top toast-end`;
    toast.innerHTML = `
      <div class="alert alert-${type === "success" ? "success" : "error"}">
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  initStickyCart() {
    this.stickyCart = document.querySelector("[data-sticky-cart]");
    if (!this.stickyCart) return;

    // Bind sticky cart events
    this.bindStickyCartEvents();
  }

  bindStickyCartEvents() {
    if (!this.stickyCart) return;

    // Toggle cart drawer from sticky cart
    this.stickyCart.addEventListener("click", (e) => {
      if (e.target.matches("[data-cart-toggle]")) {
        e.preventDefault();
        this.toggleCartDrawer();
      }
    });
  }

  updateStickyCart() {
    if (!this.stickyCart || !this.cart) return;

    const cartItemCount = this.stickyCart.querySelector("[data-cart-item-count]");
    const cartSubtotal = this.stickyCart.querySelector("[data-cart-subtotal]");
    const cartTotal = this.stickyCart.querySelector("[data-cart-total]");
    const cartCount = this.stickyCart.querySelector("[data-cart-count]");
    const cartSavings = this.stickyCart.querySelector("[data-cart-savings]");

    if (this.cart.item_count > 0) {
      // Update cart item count
      if (cartItemCount) {
        cartItemCount.textContent = this.cart.item_count;
      }

      // Update cart total
      if (cartTotal) {
        cartTotal.textContent = this.formatMoney(this.cart.total_price);
      }

      // Show cart count badge
      if (cartCount) {
        cartCount.textContent = this.cart.item_count;
        cartCount.style.display = "block";
      }

      // Show/hide free shipping message
      if (cartSavings) {
        const freeShippingThreshold = 5000; // $50.00 in cents
        if (this.cart.total_price < freeShippingThreshold) {
          const remaining = freeShippingThreshold - this.cart.total_price;
          cartSavings.innerHTML = `
            <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Add ${this.formatMoney(remaining)} more for free shipping
          `;
          cartSavings.style.display = "block";
        } else {
          cartSavings.innerHTML = `
            <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            You qualify for free shipping!
          `;
          cartSavings.style.display = "block";
        }
      }

      // Show sticky cart
      this.showStickyCart();
    } else {
      // Hide sticky cart when empty
      this.hideStickyCart();
    }
  }

  showStickyCart() {
    if (!this.stickyCart) return;
    
    // Don't show on cart or checkout pages
    if (document.body.classList.contains('template-cart') || 
        document.body.classList.contains('template-checkout')) {
      return;
    }

    this.stickyCart.classList.add("show");
  }

  hideStickyCart() {
    if (!this.stickyCart) return;
    this.stickyCart.classList.remove("show");
  }

  animateStickyCart() {
    if (!this.stickyCart) return;
    
    // Add a temporary class for animation
    this.stickyCart.classList.add("cart-added");
    
    // Remove the animation class after animation completes
    setTimeout(() => {
      this.stickyCart.classList.remove("cart-added");
    }, 600);
  }

  handleScroll() {
    if (!this.stickyCart || !this.cart || this.cart.item_count === 0) return;

    // Don't show on cart or checkout pages
    if (document.body.classList.contains('template-cart') || 
        document.body.classList.contains('template-checkout')) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Show sticky cart when user scrolls down more than 200px
    // or when they're near the bottom of the page
    const shouldShow = scrollTop > 200 || (scrollTop + windowHeight) >= (documentHeight - 100);
    
    if (shouldShow) {
      this.showStickyCart();
    } else {
      this.hideStickyCart();
    }
  }
}

// Initialize cart manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CartManager();
});
