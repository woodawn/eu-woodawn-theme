/**
 * Lazy Loading functionality for images
 * Handles intersection observer for lazy loading images
 */

class LazyLoader {
  constructor() {
    this.imageObserver = null;
    this.init();
  }

  init() {
    // Check if IntersectionObserver is supported
    if ("IntersectionObserver" in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    };

    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.imageObserver.unobserve(entry.target);
        }
      });
    }, options);

    // Observe all images with data-src attribute
    this.observeImages();
  }

  observeImages() {
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => {
      this.imageObserver.observe(img);
    });
  }

  loadImage(img) {
    const src = img.getAttribute("data-src");
    if (src) {
      // Create a new image to preload
      const imageLoader = new Image();

      imageLoader.onload = () => {
        // Replace the placeholder with the actual image
        img.src = src;
        img.removeAttribute("data-src");

        // Remove blur effect
        img.classList.remove("blur-sm");

        // Add fade-in effect
        img.style.opacity = "0";
        img.style.transition = "opacity 0.3s ease-in-out";

        requestAnimationFrame(() => {
          img.style.opacity = "1";
        });
      };

      imageLoader.onerror = () => {
        console.warn("Failed to load image:", src);
        // Remove the broken image placeholder
        img.style.display = "none";
      };

      imageLoader.src = src;
    }
  }

  loadAllImages() {
    // Fallback for browsers without IntersectionObserver
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => {
      this.loadImage(img);
    });
  }

  // Method to observe new images added dynamically
  observeNewImages() {
    if (this.imageObserver) {
      this.observeImages();
    }
  }
}

// Initialize lazy loader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new LazyLoader();
});

// Re-observe images when new content is loaded (e.g., AJAX)
document.addEventListener("lazyLoadRefresh", () => {
  if (window.lazyLoader) {
    window.lazyLoader.observeNewImages();
  }
});
