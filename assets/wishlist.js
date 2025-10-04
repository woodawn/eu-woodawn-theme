/**
 * Wishlist functionality for Shopify theme
 * Handles adding/removing products from wishlist using localStorage
 */

class WishlistManager {
  constructor() {
    this.wishlist = this.loadWishlist();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateWishlistUI();
  }

  bindEvents() {
    // Wishlist toggle buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-wishlist-toggle]")) {
        e.preventDefault();
        this.toggleWishlist(e.target);
      }
    });

    // Wishlist page buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-wishlist-remove]")) {
        e.preventDefault();
        this.removeFromWishlist(e.target.dataset.productId);
      }
    });

    // Clear wishlist
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-wishlist-clear]")) {
        e.preventDefault();
        this.clearWishlist();
      }
    });
  }

  toggleWishlist(button) {
    const productId = button.dataset.productId;
    const productTitle = button.dataset.productTitle;
    const productImage = button.dataset.productImage;
    const productUrl = button.dataset.productUrl;
    const productPrice = button.dataset.productPrice;

    if (this.isInWishlist(productId)) {
      this.removeFromWishlist(productId);
      this.showMessage("Removed from wishlist", "success");
    } else {
      this.addToWishlist({
        id: productId,
        title: productTitle,
        image: productImage,
        url: productUrl,
        price: productPrice,
        addedAt: new Date().toISOString(),
      });
      this.showMessage("Added to wishlist", "success");
    }

    this.updateWishlistUI();
  }

  addToWishlist(product) {
    if (!this.isInWishlist(product.id)) {
      this.wishlist.push(product);
      this.saveWishlist();
    }
  }

  removeFromWishlist(productId) {
    this.wishlist = this.wishlist.filter((item) => item.id !== productId);
    this.saveWishlist();
  }

  clearWishlist() {
    this.wishlist = [];
    this.saveWishlist();
    this.updateWishlistUI();
    this.showMessage("Wishlist cleared", "success");
  }

  isInWishlist(productId) {
    return this.wishlist.some((item) => item.id === productId);
  }

  loadWishlist() {
    try {
      const stored = localStorage.getItem("shopify-wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem("shopify-wishlist", JSON.stringify(this.wishlist));
    } catch (error) {
      console.error("Failed to save wishlist:", error);
    }
  }

  updateWishlistUI() {
    // Update wishlist buttons
    document.querySelectorAll("[data-wishlist-toggle]").forEach((button) => {
      const productId = button.dataset.productId;
      const isInWishlist = this.isInWishlist(productId);

      // Update button appearance
      if (isInWishlist) {
        button.classList.add("wishlist-active");
        button.innerHTML = `
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        `;
      } else {
        button.classList.remove("wishlist-active");
        button.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        `;
      }
    });

    // Update wishlist count
    const wishlistCount = document.querySelector("[data-wishlist-count]");
    if (wishlistCount) {
      wishlistCount.textContent = this.wishlist.length;
      wishlistCount.style.display = this.wishlist.length > 0 ? "block" : "none";
    }

    // Update wishlist page if exists
    this.updateWishlistPage();
  }

  updateWishlistPage() {
    const wishlistContainer = document.querySelector(".wishlist-items");
    if (!wishlistContainer) return;

    if (this.wishlist.length === 0) {
      wishlistContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">💝</div>
          <h3 class="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p class="text-base-content/70 mb-6">Start adding products you love to your wishlist.</p>
          <a href="/collections/all" class="btn btn-primary">Continue Shopping</a>
        </div>
      `;
    } else {
      wishlistContainer.innerHTML = this.wishlist
        .map(
          (item) => `
        <div class="card bg-base-100 shadow-lg">
          <figure class="relative">
            <a href="${item.url}">
              <img src="${item.image}" alt="${
            item.title
          }" class="w-full h-48 object-cover">
            </a>
            <button 
              class="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
              data-wishlist-remove
              data-product-id="${item.id}"
              title="Remove from wishlist"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </figure>
          <div class="card-body">
            <h3 class="card-title">
              <a href="${item.url}" class="hover:text-primary">${item.title}</a>
            </h3>
            <p class="text-lg font-bold text-primary">${this.formatMoney(
              item.price
            )}</p>
            <div class="card-actions justify-end">
              <a href="${
                item.url
              }" class="btn btn-outline btn-sm">View Details</a>
              <button class="btn btn-primary btn-sm" onclick="addToCartFromWishlist('${
                item.id
              }')">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    }
  }

  showMessage(message, type = "info") {
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

  // Public method to get wishlist items
  getWishlistItems() {
    return this.wishlist;
  }

  // Public method to check if product is in wishlist
  isProductInWishlist(productId) {
    return this.isInWishlist(productId);
  }
}

// Global function for adding to cart from wishlist
window.addToCartFromWishlist = function (productId) {
  // Find the product in wishlist
  const wishlistItem = window.wishlistManager
    .getWishlistItems()
    .find((item) => item.id === productId);

  if (wishlistItem) {
    // Create a form to add to cart
    const form = document.createElement("form");
    form.action = "/cart/add";
    form.method = "post";
    form.innerHTML = `
      <input type="hidden" name="id" value="${productId}">
      <input type="hidden" name="quantity" value="1">
    `;

    // Submit the form
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }
};

// Initialize wishlist manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.wishlistManager = new WishlistManager();
});
