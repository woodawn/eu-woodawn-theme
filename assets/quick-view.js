/**
 * Quick View functionality for Shopify theme
 * Shows product details in a modal without page reload
 */

class QuickViewManager {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    // Create modal element
    this.modal = document.createElement("div");
    this.modal.id = "quick-view-modal";
    this.modal.className = "modal";
    this.modal.innerHTML = `
      <div class="modal-box max-w-6xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-bold">Quick View</h3>
          <button class="btn btn-sm btn-circle btn-ghost" data-quick-view-close>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="quick-view-content">
          <div class="loading loading-spinner loading-lg mx-auto"></div>
          <p class="text-center mt-4">Loading product details...</p>
        </div>
      </div>
      <div class="modal-backdrop" data-quick-view-close></div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    // Quick view buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-quick-view]")) {
        e.preventDefault();
        const productHandle = e.target.dataset.productHandle;
        this.showQuickView(productHandle);
      }
    });

    // Close modal
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-quick-view-close]")) {
        this.closeModal();
      }
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("modal-open")) {
        this.closeModal();
      }
    });
  }

  async showQuickView(productHandle) {
    this.openModal();
    this.showLoading();

    try {
      // Fetch product data
      const response = await fetch(`/products/${productHandle}.js`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const product = await response.json();
      this.displayProduct(product);
    } catch (error) {
      console.error("Quick view error:", error);
      this.showError();
    }
  }

  displayProduct(product) {
    const content = this.modal.querySelector(".quick-view-content");

    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Product Images -->
        <div class="product-images">
          <div class="carousel w-full">
            ${product.images
              .map(
                (image, index) => `
              <div id="item${index}" class="carousel-item w-full">
                <img src="${image}" alt="${product.title}" class="w-full h-96 object-cover rounded-lg">
              </div>
            `
              )
              .join("")}
          </div>
          ${
            product.images.length > 1
              ? `
            <div class="flex justify-center w-full py-2 gap-2">
              ${product.images
                .map(
                  (_, index) => `
                <a href="#item${index}" class="btn btn-xs">${index + 1}</a>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <h1 class="text-3xl font-bold mb-4">${product.title}</h1>
          
          <!-- Price -->
          <div class="mb-6">
            ${
              product.compare_at_price > product.price
                ? `
              <div class="flex items-center gap-3">
                <span class="text-3xl font-bold text-primary">${this.formatMoney(
                  product.price
                )}</span>
                <span class="text-xl text-base-content/50 line-through">${this.formatMoney(
                  product.compare_at_price
                )}</span>
                <span class="badge badge-success">Save ${this.formatMoney(
                  product.compare_at_price - product.price
                )}</span>
              </div>
            `
                : `
              <span class="text-3xl font-bold text-primary">${this.formatMoney(
                product.price
              )}</span>
            `
            }
          </div>

          <!-- Description -->
          ${
            product.description
              ? `
            <div class="prose max-w-none mb-6">
              ${product.description}
            </div>
          `
              : ""
          }

          <!-- Product Form -->
          <form action="/cart/add" method="post" class="space-y-6">
            <input type="hidden" name="id" value="${product.variants[0].id}">
            
            <!-- Variant Selection -->
            ${
              product.variants.length > 1
                ? `
              <div class="space-y-4">
                ${product.options
                  .map(
                    (option, optionIndex) => `
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-semibold">${
                        option.name
                      }</span>
                    </label>
                    <select name="properties[${
                      option.name
                    }]" class="select select-bordered w-full">
                      ${product.options_with_values[optionIndex].values
                        .map(
                          (value) => `
                        <option value="${value}">${value}</option>
                      `
                        )
                        .join("")}
                    </select>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }

            <!-- Quantity -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Quantity</span>
              </label>
              <div class="flex items-center gap-3">
                <button type="button" class="btn btn-outline btn-sm" onclick="decreaseQuickViewQuantity()">-</button>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value="1"
                  class="input input-bordered w-20 text-center"
                  id="quick-view-quantity"
                >
                <button type="button" class="btn btn-outline btn-sm" onclick="increaseQuickViewQuantity()">+</button>
              </div>
            </div>

            <!-- Add to Cart -->
            <div class="space-y-3">
              ${
                product.available
                  ? `
                <button type="submit" class="btn btn-primary btn-lg w-full">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
                  </svg>
                  Add to Cart - ${this.formatMoney(product.price)}
                </button>
              `
                  : `
                <button class="btn btn-disabled btn-lg w-full">Sold Out</button>
              `
              }
            </div>

            <!-- Product Features -->
            <div class="grid grid-cols-2 gap-4 mt-6">
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Free Shipping</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>30-Day Returns</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>2-Year Warranty</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>24/7 Support</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add wishlist button
    const productInfo = content.querySelector(".product-info");
    const wishlistButton = document.createElement("div");
    wishlistButton.className = "mt-4";
    wishlistButton.innerHTML = `
      <button
        class="btn btn-outline"
        data-wishlist-toggle
        data-product-id="${product.id}"
        data-product-title="${product.title}"
        data-product-image="${product.featured_image}"
        data-product-url="${product.url}"
        data-product-price="${product.price}"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
        Add to Wishlist
      </button>
    `;
    productInfo.appendChild(wishlistButton);

    // Update wishlist button state
    if (window.wishlistManager) {
      window.wishlistManager.updateWishlistUI();
    }
  }

  showLoading() {
    const content = this.modal.querySelector(".quick-view-content");
    content.innerHTML = `
      <div class="text-center py-12">
        <div class="loading loading-spinner loading-lg mx-auto"></div>
        <p class="mt-4">Loading product details...</p>
      </div>
    `;
  }

  showError() {
    const content = this.modal.querySelector(".quick-view-content");
    content.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">😞</div>
        <h3 class="text-xl font-semibold mb-2">Oops! Something went wrong</h3>
        <p class="text-base-content/70 mb-6">We couldn't load the product details. Please try again.</p>
        <button class="btn btn-primary" onclick="this.closest('.modal').classList.remove('modal-open')">
          Close
        </button>
      </div>
    `;
  }

  openModal() {
    this.modal.classList.add("modal-open");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.modal.classList.remove("modal-open");
    document.body.style.overflow = "";
  }

  formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }
}

// Global functions for quantity controls
window.increaseQuickViewQuantity = function () {
  const input = document.getElementById("quick-view-quantity");
  if (input) {
    input.value = parseInt(input.value) + 1;
  }
};

window.decreaseQuickViewQuantity = function () {
  const input = document.getElementById("quick-view-quantity");
  if (input && parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
};

// Initialize quick view manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new QuickViewManager();
});
