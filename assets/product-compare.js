/**
 * Product Comparison functionality for Shopify theme
 * Allows users to compare up to 4 products side by side
 */

class ProductCompareManager {
  constructor() {
    this.compareList = this.loadCompareList();
    this.maxItems = 4;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCompareUI();
  }

  bindEvents() {
    // Compare toggle buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-compare-toggle]")) {
        e.preventDefault();
        this.toggleCompare(e.target);
      }
    });

    // Compare modal buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-compare-remove]")) {
        e.preventDefault();
        this.removeFromCompare(e.target.dataset.productId);
      }
    });

    // Clear compare list
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-compare-clear]")) {
        e.preventDefault();
        this.clearCompare();
      }
    });

    // Open compare modal
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-compare-open]")) {
        e.preventDefault();
        this.openCompareModal();
      }
    });
  }

  toggleCompare(button) {
    const productId = button.dataset.productId;
    const productData = {
      id: productId,
      title: button.dataset.productTitle,
      image: button.dataset.productImage,
      url: button.dataset.productUrl,
      price: button.dataset.productPrice,
      vendor: button.dataset.productVendor,
      type: button.dataset.productType,
    };

    if (this.isInCompare(productId)) {
      this.removeFromCompare(productId);
      this.showMessage("Removed from comparison", "success");
    } else {
      if (this.compareList.length >= this.maxItems) {
        this.showMessage(
          `You can only compare up to ${this.maxItems} products`,
          "error"
        );
        return;
      }
      this.addToCompare(productData);
      this.showMessage("Added to comparison", "success");
    }

    this.updateCompareUI();
  }

  addToCompare(product) {
    if (!this.isInCompare(product.id)) {
      this.compareList.push(product);
      this.saveCompareList();
    }
  }

  removeFromCompare(productId) {
    this.compareList = this.compareList.filter((item) => item.id !== productId);
    this.saveCompareList();
    this.updateCompareUI();
  }

  clearCompare() {
    this.compareList = [];
    this.saveCompareList();
    this.updateCompareUI();
    this.showMessage("Comparison cleared", "success");
  }

  isInCompare(productId) {
    return this.compareList.some((item) => item.id === productId);
  }

  loadCompareList() {
    try {
      const stored = localStorage.getItem("shopify-compare");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load compare list:", error);
      return [];
    }
  }

  saveCompareList() {
    try {
      localStorage.setItem("shopify-compare", JSON.stringify(this.compareList));
    } catch (error) {
      console.error("Failed to save compare list:", error);
    }
  }

  updateCompareUI() {
    // Update compare buttons
    document.querySelectorAll("[data-compare-toggle]").forEach((button) => {
      const productId = button.dataset.productId;
      const isInCompare = this.isInCompare(productId);

      if (isInCompare) {
        button.classList.add("compare-active");
        button.innerHTML = `
          <svg class="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          In Compare
        `;
      } else {
        button.classList.remove("compare-active");
        button.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Compare
        `;
      }
    });

    // Update compare count
    const compareCount = document.querySelector("[data-compare-count]");
    if (compareCount) {
      compareCount.textContent = this.compareList.length;
      compareCount.style.display =
        this.compareList.length > 0 ? "block" : "none";
    }

    // Update compare button in header
    const compareButton = document.querySelector("[data-compare-open]");
    if (compareButton) {
      if (this.compareList.length > 0) {
        compareButton.style.display = "block";
        compareButton.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Compare (${this.compareList.length})
        `;
      } else {
        compareButton.style.display = "none";
      }
    }
  }

  openCompareModal() {
    if (this.compareList.length === 0) {
      this.showMessage("No products to compare", "error");
      return;
    }

    this.createCompareModal();
  }

  createCompareModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById("compare-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const modal = document.createElement("div");
    modal.id = "compare-modal";
    modal.className = "modal modal-open";
    modal.innerHTML = `
      <div class="modal-box max-w-7xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold">Product Comparison</h3>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" data-compare-clear>Clear All</button>
            <button class="btn btn-sm btn-circle btn-ghost" data-compare-close>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="compare-content">
          ${this.generateCompareTable()}
        </div>
      </div>
      <div class="modal-backdrop" data-compare-close></div>
    `;

    document.body.appendChild(modal);

    // Bind close events
    modal.querySelectorAll("[data-compare-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.remove();
      });
    });

    modal
      .querySelector("[data-compare-clear]")
      .addEventListener("click", () => {
        this.clearCompare();
        modal.remove();
      });
  }

  generateCompareTable() {
    if (this.compareList.length === 0) {
      return `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2">No products to compare</h3>
          <p class="text-base-content/70">Add products to compare their features.</p>
        </div>
      `;
    }

    const features = [
      "Image",
      "Product Name",
      "Price",
      "Vendor",
      "Type",
      "Actions",
    ];

    return `
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              ${features.map((feature) => `<th>${feature}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${this.compareList
                .map(
                  (product) => `
                <td>
                  <div class="w-20 h-20 bg-base-200 rounded-lg overflow-hidden">
                    <img src="${product.image}" alt="${
                    product.title
                  }" class="w-full h-full object-cover">
                  </div>
                </td>
                <td>
                  <div class="font-semibold">${product.title}</div>
                </td>
                <td>
                  <div class="font-bold text-primary">${this.formatMoney(
                    product.price
                  )}</div>
                </td>
                <td>${product.vendor}</td>
                <td>${product.type}</td>
                <td>
                  <div class="flex gap-2">
                    <a href="${
                      product.url
                    }" class="btn btn-outline btn-xs">View</a>
                    <button 
                      class="btn btn-error btn-xs"
                      data-compare-remove
                      data-product-id="${product.id}"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              `
                )
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;
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
}

// Initialize compare manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.compareManager = new ProductCompareManager();
});
