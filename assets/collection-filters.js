/**
 * Collection Filters functionality for Shopify theme
 * Handles filtering products by price, availability, brand, type, etc.
 */

class CollectionFilters {
  constructor() {
    this.filters = {
      price: [],
      availability: [],
      vendor: [],
      product_type: [],
      tags: [],
    };
    this.sortBy = "manual";
    this.currentPage = 1;
    this.init();
  }

  init() {
    this.bindEvents();
    this.parseURLParams();
    this.applyFilters();
  }

  bindEvents() {
    // Price filter
    document.addEventListener("change", (e) => {
      if (e.target.matches('input[name="price"]')) {
        this.handlePriceFilter(e.target);
      }
    });

    // Availability filter
    document.addEventListener("change", (e) => {
      if (e.target.matches('input[name="availability"]')) {
        this.handleAvailabilityFilter(e.target);
      }
    });

    // Vendor filter
    document.addEventListener("change", (e) => {
      if (e.target.matches('input[name="vendor"]')) {
        this.handleVendorFilter(e.target);
      }
    });

    // Product type filter
    document.addEventListener("change", (e) => {
      if (e.target.matches('input[name="product_type"]')) {
        this.handleProductTypeFilter(e.target);
      }
    });

    // Tag filter
    document.addEventListener("change", (e) => {
      if (e.target.matches('input[name="tag"]')) {
        this.handleTagFilter(e.target);
      }
    });

    // Sort dropdown
    document.addEventListener("change", (e) => {
      if (e.target.matches('select[name="sort_by"]')) {
        this.handleSortChange(e.target);
      }
    });

    // Clear filters
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-clear-filters]")) {
        this.clearAllFilters();
      }
    });

    // Mobile filter toggle
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-mobile-filters-toggle]")) {
        this.toggleMobileFilters();
      }
    });
  }

  handlePriceFilter(input) {
    const value = input.value;
    this.filters.price = value === "all" ? [] : [value];
    this.applyFilters();
  }

  handleAvailabilityFilter(input) {
    const value = input.value;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.filters.availability.includes(value)) {
        this.filters.availability.push(value);
      }
    } else {
      this.filters.availability = this.filters.availability.filter(
        (item) => item !== value
      );
    }
    this.applyFilters();
  }

  handleVendorFilter(input) {
    const value = input.value;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.filters.vendor.includes(value)) {
        this.filters.vendor.push(value);
      }
    } else {
      this.filters.vendor = this.filters.vendor.filter(
        (item) => item !== value
      );
    }
    this.applyFilters();
  }

  handleProductTypeFilter(input) {
    const value = input.value;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.filters.product_type.includes(value)) {
        this.filters.product_type.push(value);
      }
    } else {
      this.filters.product_type = this.filters.product_type.filter(
        (item) => item !== value
      );
    }
    this.applyFilters();
  }

  handleTagFilter(input) {
    const value = input.value;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.filters.tags.includes(value)) {
        this.filters.tags.push(value);
      }
    } else {
      this.filters.tags = this.filters.tags.filter((item) => item !== value);
    }
    this.applyFilters();
  }

  handleSortChange(select) {
    this.sortBy = select.value;
    this.applyFilters();
  }

  applyFilters() {
    const products = document.querySelectorAll(".product-card");
    let visibleCount = 0;

    products.forEach((product) => {
      const shouldShow = this.shouldShowProduct(product);
      product.style.display = shouldShow ? "block" : "none";
      if (shouldShow) visibleCount++;
    });

    this.updateResultsCount(visibleCount);
    this.updateURL();
  }

  shouldShowProduct(product) {
    const productData = this.getProductData(product);

    // Price filter
    if (this.filters.price.length > 0) {
      const price = productData.price;
      const priceInRange = this.filters.price.some((range) => {
        switch (range) {
          case "under-100":
            return price < 10000; // $100 in cents
          case "100-300":
            return price >= 10000 && price <= 30000;
          case "over-300":
            return price > 30000;
          default:
            return true;
        }
      });
      if (!priceInRange) return false;
    }

    // Availability filter
    if (this.filters.availability.length > 0) {
      const isAvailable = productData.available;
      const isOnSale = productData.compare_at_price > productData.price;

      const availabilityMatch = this.filters.availability.some((filter) => {
        switch (filter) {
          case "in-stock":
            return isAvailable;
          case "on-sale":
            return isOnSale;
          default:
            return true;
        }
      });
      if (!availabilityMatch) return false;
    }

    // Vendor filter
    if (this.filters.vendor.length > 0) {
      if (!this.filters.vendor.includes(productData.vendor)) return false;
    }

    // Product type filter
    if (this.filters.product_type.length > 0) {
      if (!this.filters.product_type.includes(productData.type)) return false;
    }

    // Tags filter
    if (this.filters.tags.length > 0) {
      const hasMatchingTag = this.filters.tags.some((tag) =>
        productData.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  }

  getProductData(product) {
    return {
      price: parseInt(product.dataset.price) || 0,
      available: product.dataset.available === "true",
      compare_at_price: parseInt(product.dataset.compareAtPrice) || 0,
      vendor: product.dataset.vendor || "",
      type: product.dataset.type || "",
      tags: (product.dataset.tags || "").split(",").filter(Boolean),
    };
  }

  updateResultsCount(count) {
    const resultsElement = document.querySelector("[data-results-count]");
    if (resultsElement) {
      resultsElement.textContent = `${count} products`;
    }
  }

  updateURL() {
    const url = new URL(window.location);

    // Clear existing filter params
    const filterParams = [
      "price",
      "availability",
      "vendor",
      "product_type",
      "tag",
      "sort_by",
    ];
    filterParams.forEach((param) => {
      url.searchParams.delete(param);
    });

    // Add current filters
    if (this.filters.price.length > 0) {
      url.searchParams.set("price", this.filters.price.join(","));
    }
    if (this.filters.availability.length > 0) {
      url.searchParams.set("availability", this.filters.availability.join(","));
    }
    if (this.filters.vendor.length > 0) {
      url.searchParams.set("vendor", this.filters.vendor.join(","));
    }
    if (this.filters.product_type.length > 0) {
      url.searchParams.set("product_type", this.filters.product_type.join(","));
    }
    if (this.filters.tags.length > 0) {
      url.searchParams.set("tag", this.filters.tags.join(","));
    }
    if (this.sortBy !== "manual") {
      url.searchParams.set("sort_by", this.sortBy);
    }

    // Update URL without page reload
    window.history.pushState({}, "", url);
  }

  parseURLParams() {
    const url = new URL(window.location);

    // Parse price filter
    const price = url.searchParams.get("price");
    if (price) {
      this.filters.price = price.split(",");
    }

    // Parse availability filter
    const availability = url.searchParams.get("availability");
    if (availability) {
      this.filters.availability = availability.split(",");
    }

    // Parse vendor filter
    const vendor = url.searchParams.get("vendor");
    if (vendor) {
      this.filters.vendor = vendor.split(",");
    }

    // Parse product type filter
    const productType = url.searchParams.get("product_type");
    if (productType) {
      this.filters.product_type = productType.split(",");
    }

    // Parse tags filter
    const tags = url.searchParams.get("tag");
    if (tags) {
      this.filters.tags = tags.split(",");
    }

    // Parse sort
    const sortBy = url.searchParams.get("sort_by");
    if (sortBy) {
      this.sortBy = sortBy;
    }

    // Update UI to reflect URL params
    this.updateFilterUI();
  }

  updateFilterUI() {
    // Update price filter
    this.filters.price.forEach((price) => {
      const input = document.querySelector(
        `input[name="price"][value="${price}"]`
      );
      if (input) input.checked = true;
    });

    // Update availability filter
    this.filters.availability.forEach((availability) => {
      const input = document.querySelector(
        `input[name="availability"][value="${availability}"]`
      );
      if (input) input.checked = true;
    });

    // Update vendor filter
    this.filters.vendor.forEach((vendor) => {
      const input = document.querySelector(
        `input[name="vendor"][value="${vendor}"]`
      );
      if (input) input.checked = true;
    });

    // Update product type filter
    this.filters.product_type.forEach((type) => {
      const input = document.querySelector(
        `input[name="product_type"][value="${type}"]`
      );
      if (input) input.checked = true;
    });

    // Update tags filter
    this.filters.tags.forEach((tag) => {
      const input = document.querySelector(`input[name="tag"][value="${tag}"]`);
      if (input) input.checked = true;
    });

    // Update sort dropdown
    const sortSelect = document.querySelector('select[name="sort_by"]');
    if (sortSelect) {
      sortSelect.value = this.sortBy;
    }
  }

  clearAllFilters() {
    this.filters = {
      price: [],
      availability: [],
      vendor: [],
      product_type: [],
      tags: [],
    };
    this.sortBy = "manual";

    // Clear all checkboxes and radio buttons
    document.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });
    document.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.checked = false;
    });

    // Reset sort dropdown
    const sortSelect = document.querySelector('select[name="sort_by"]');
    if (sortSelect) {
      sortSelect.value = "manual";
    }

    this.applyFilters();
    this.showMessage("Filters cleared", "success");
  }

  toggleMobileFilters() {
    const mobileFilters = document.getElementById("mobile-filters");
    if (mobileFilters) {
      mobileFilters.classList.toggle("hidden");
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
}

// Initialize collection filters when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".collection-filters")) {
    new CollectionFilters();
  }
});
