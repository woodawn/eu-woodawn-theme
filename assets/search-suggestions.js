/**
 * Search Suggestions functionality
 * Provides real-time search suggestions as user types
 */

class SearchSuggestions {
  constructor() {
    this.searchInputs = [];
    this.suggestionCache = new Map();
    this.debounceTimer = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Find all search inputs
    this.searchInputs = document.querySelectorAll(
      'input[type="search"], input[name="q"]'
    );

    this.searchInputs.forEach((input) => {
      // Create suggestion container
      this.createSuggestionContainer(input);

      // Bind events
      input.addEventListener("input", (e) => {
        this.handleInput(e.target);
      });

      input.addEventListener("focus", (e) => {
        this.showSuggestions(e.target);
      });

      input.addEventListener("blur", (e) => {
        // Delay hiding to allow clicking on suggestions
        setTimeout(() => {
          this.hideSuggestions(e.target);
        }, 200);
      });

      input.addEventListener("keydown", (e) => {
        this.handleKeydown(e);
      });
    });

    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-suggestions-container")) {
        this.hideAllSuggestions();
      }
    });
  }

  createSuggestionContainer(input) {
    const container = document.createElement("div");
    container.className = "search-suggestions-container relative";

    const suggestions = document.createElement("div");
    suggestions.className =
      "search-suggestions absolute top-full left-0 right-0 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto hidden";
    suggestions.innerHTML = `
      <div class="p-4">
        <div class="loading loading-spinner loading-sm"></div>
        <span class="ml-2 text-sm">Loading suggestions...</span>
      </div>
    `;

    // Insert container after input
    input.parentNode.insertBefore(container, input.nextSibling);
    container.appendChild(input);
    container.appendChild(suggestions);

    // Store reference
    input.suggestionContainer = suggestions;
  }

  handleInput(input) {
    const query = input.value.trim();

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (query.length < 2) {
      this.hideSuggestions(input);
      return;
    }

    // Debounce the search
    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(query, input);
    }, 300);
  }

  async fetchSuggestions(query, input) {
    // Check cache first
    if (this.suggestionCache.has(query)) {
      this.displaySuggestions(this.suggestionCache.get(query), input);
      return;
    }

    try {
      // Show loading state
      this.showLoading(input);

      // Fetch suggestions from Shopify
      const response = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(
          query
        )}&resources[type]=product&resources[limit]=5`
      );

      if (response.ok) {
        const data = await response.json();
        const suggestions = this.processSuggestions(data);

        // Cache the results
        this.suggestionCache.set(query, suggestions);

        this.displaySuggestions(suggestions, input);
      } else {
        this.showError(input);
      }
    } catch (error) {
      console.error("Search suggestions error:", error);
      this.showError(input);
    }
  }

  processSuggestions(data) {
    const suggestions = [];

    // Process product suggestions
    if (
      data.resources &&
      data.resources.results &&
      data.resources.results.products
    ) {
      data.resources.results.products.forEach((product) => {
        suggestions.push({
          type: "product",
          title: product.title,
          url: product.url,
          image: product.image,
          price: product.price,
          vendor: product.vendor,
        });
      });
    }

    // Add popular searches
    if (data.queries && data.queries.length > 0) {
      data.queries.slice(0, 3).forEach((query) => {
        suggestions.push({
          type: "query",
          title: query,
          url: `/search?q=${encodeURIComponent(query)}`,
        });
      });
    }

    return suggestions;
  }

  displaySuggestions(suggestions, input) {
    const container = input.suggestionContainer;

    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-base-content/70">
          <p>No suggestions found</p>
        </div>
      `;
    } else {
      container.innerHTML = suggestions
        .map((suggestion) => {
          if (suggestion.type === "product") {
            return `
            <a href="${
              suggestion.url
            }" class="flex items-center gap-3 p-3 hover:bg-base-200 transition-colors">
              <div class="w-12 h-12 bg-base-200 rounded-lg overflow-hidden flex-shrink-0">
                ${
                  suggestion.image
                    ? `<img src="${suggestion.image}" alt="${suggestion.title}" class="w-full h-full object-cover">`
                    : ""
                }
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-sm truncate">${
                  suggestion.title
                }</h4>
                <p class="text-xs text-base-content/70">${suggestion.vendor}</p>
                <p class="text-sm font-bold text-primary">${this.formatMoney(
                  suggestion.price
                )}</p>
              </div>
            </a>
          `;
          } else {
            return `
            <a href="${suggestion.url}" class="flex items-center gap-3 p-3 hover:bg-base-200 transition-colors">
              <svg class="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <span class="text-sm">${suggestion.title}</span>
            </a>
          `;
          }
        })
        .join("");
    }

    this.showSuggestions(input);
  }

  showLoading(input) {
    const container = input.suggestionContainer;
    container.innerHTML = `
      <div class="p-4 flex items-center">
        <div class="loading loading-spinner loading-sm"></div>
        <span class="ml-2 text-sm">Loading suggestions...</span>
      </div>
    `;
    this.showSuggestions(input);
  }

  showError(input) {
    const container = input.suggestionContainer;
    container.innerHTML = `
      <div class="p-4 text-center text-error">
        <p class="text-sm">Failed to load suggestions</p>
      </div>
    `;
    this.showSuggestions(input);
  }

  showSuggestions(input) {
    const container = input.suggestionContainer;
    container.classList.remove("hidden");
  }

  hideSuggestions(input) {
    const container = input.suggestionContainer;
    container.classList.add("hidden");
  }

  hideAllSuggestions() {
    this.searchInputs.forEach((input) => {
      this.hideSuggestions(input);
    });
  }

  handleKeydown(e) {
    const container = e.target.suggestionContainer;
    if (!container || container.classList.contains("hidden")) return;

    const suggestions = container.querySelectorAll("a");
    const current = container.querySelector("a.highlighted");
    let index = current ? Array.from(suggestions).indexOf(current) : -1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        index = Math.min(index + 1, suggestions.length - 1);
        this.highlightSuggestion(suggestions, index);
        break;

      case "ArrowUp":
        e.preventDefault();
        index = Math.max(index - 1, -1);
        this.highlightSuggestion(suggestions, index);
        break;

      case "Enter":
        if (current) {
          e.preventDefault();
          current.click();
        }
        break;

      case "Escape":
        this.hideSuggestions(e.target);
        break;
    }
  }

  highlightSuggestion(suggestions, index) {
    suggestions.forEach((suggestion, i) => {
      suggestion.classList.toggle("highlighted", i === index);
      suggestion.classList.toggle("bg-base-200", i === index);
    });
  }

  formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }
}

// Initialize search suggestions when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SearchSuggestions();
});
