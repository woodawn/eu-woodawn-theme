/**
 * Stock Notifications functionality for Shopify theme
 * Handles back-in-stock notifications for out-of-stock products
 */

class StockNotifications {
  constructor() {
    this.notifications = this.loadNotifications();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateNotificationUI();
  }

  bindEvents() {
    // Stock notification buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-stock-notify]")) {
        e.preventDefault();
        this.showNotificationModal(e.target);
      }
    });

    // Notification form submission
    document.addEventListener("submit", (e) => {
      if (e.target.matches("[data-stock-notification-form]")) {
        e.preventDefault();
        this.handleNotificationSubmission(e.target);
      }
    });

    // Remove notification
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-remove-notification]")) {
        e.preventDefault();
        this.removeNotification(e.target.dataset.productId);
      }
    });
  }

  showNotificationModal(button) {
    const productId = button.dataset.productId;
    const productTitle = button.dataset.productTitle;
    const productImage = button.dataset.productImage;

    // Create modal
    const modal = document.createElement("div");
    modal.id = "stock-notification-modal";
    modal.className = "modal modal-open";
    modal.innerHTML = `
      <div class="modal-box max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Notify me when back in stock</h3>
          <button class="btn btn-sm btn-circle btn-ghost" data-close-modal>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 bg-base-200 rounded-lg overflow-hidden">
            <img src="${productImage}" alt="${productTitle}" class="w-full h-full object-cover">
          </div>
          <div>
            <h4 class="font-semibold">${productTitle}</h4>
            <p class="text-sm text-base-content/70">Currently out of stock</p>
          </div>
        </div>

        <form data-stock-notification-form data-product-id="${productId}">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Email address</span>
            </label>
            <input 
              type="email" 
              name="email" 
              class="input input-bordered w-full" 
              placeholder="your@email.com"
              required
            >
          </div>
          
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Phone number (optional)</span>
            </label>
            <input 
              type="tel" 
              name="phone" 
              class="input input-bordered w-full" 
              placeholder="+1 (555) 123-4567"
            >
          </div>

          <div class="form-control mb-6">
            <label class="label cursor-pointer">
              <span class="label-text">Send SMS notifications</span>
              <input type="checkbox" name="sms_enabled" class="checkbox checkbox-primary">
            </label>
          </div>

          <div class="flex gap-3">
            <button type="button" class="btn btn-outline flex-1" data-close-modal>Cancel</button>
            <button type="submit" class="btn btn-primary flex-1">
              <span class="loading loading-spinner loading-sm hidden"></span>
              Notify Me
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" data-close-modal></div>
    `;

    document.body.appendChild(modal);

    // Bind close events
    modal.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.remove();
      });
    });
  }

  async handleNotificationSubmission(form) {
    const productId = form.dataset.productId;
    const formData = new FormData(form);
    const email = formData.get("email");
    const phone = formData.get("phone");
    const smsEnabled = formData.get("sms_enabled") === "on";

    const submitButton = form.querySelector('button[type="submit"]');
    const loadingSpinner = submitButton.querySelector(".loading");

    // Show loading state
    submitButton.disabled = true;
    loadingSpinner.classList.remove("hidden");

    try {
      // Check if notification already exists
      if (this.hasNotification(productId, email)) {
        this.showMessage(
          "You're already signed up for notifications for this product",
          "error"
        );
        return;
      }

      // Add notification to local storage
      const notification = {
        id: this.generateId(),
        productId: productId,
        email: email,
        phone: phone || null,
        smsEnabled: smsEnabled,
        createdAt: new Date().toISOString(),
        notified: false,
      };

      this.notifications.push(notification);
      this.saveNotifications();

      // In a real implementation, you would send this to your backend
      // await this.sendNotificationToBackend(notification);

      this.showMessage(
        "You'll be notified when this product is back in stock!",
        "success"
      );

      // Close modal
      const modal = document.getElementById("stock-notification-modal");
      if (modal) {
        modal.remove();
      }

      this.updateNotificationUI();
    } catch (error) {
      console.error("Notification submission error:", error);
      this.showMessage(
        "Failed to set up notification. Please try again.",
        "error"
      );
    } finally {
      // Reset button state
      submitButton.disabled = false;
      loadingSpinner.classList.add("hidden");
    }
  }

  hasNotification(productId, email) {
    return this.notifications.some(
      (notification) =>
        notification.productId === productId &&
        notification.email === email &&
        !notification.notified
    );
  }

  removeNotification(productId) {
    this.notifications = this.notifications.filter(
      (notification) => notification.productId !== productId
    );
    this.saveNotifications();
    this.updateNotificationUI();
    this.showMessage("Notification removed", "success");
  }

  loadNotifications() {
    try {
      const stored = localStorage.getItem("shopify-stock-notifications");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load notifications:", error);
      return [];
    }
  }

  saveNotifications() {
    try {
      localStorage.setItem(
        "shopify-stock-notifications",
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  updateNotificationUI() {
    // Update notification buttons
    document.querySelectorAll("[data-stock-notify]").forEach((button) => {
      const productId = button.dataset.productId;
      const hasNotification = this.notifications.some(
        (notification) =>
          notification.productId === productId && !notification.notified
      );

      if (hasNotification) {
        button.classList.add("notification-active");
        button.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Notify Me (Active)
        `;
        button.disabled = true;
      } else {
        button.classList.remove("notification-active");
        button.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z"/>
          </svg>
          Notify Me
        `;
        button.disabled = false;
      }
    });
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

  // Method to check stock status (would be called by backend)
  async checkStockStatus() {
    // In a real implementation, this would check with your backend
    // to see if any products are back in stock and send notifications
    console.log("Checking stock status...");
  }

  // Method to get all notifications (for admin purposes)
  getNotifications() {
    return this.notifications;
  }
}

// Initialize stock notifications when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.stockNotifications = new StockNotifications();
});
