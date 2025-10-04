/**
 * Sticky Header JavaScript
 * 实现 sticky header 的滚动行为
 */

class StickyHeader {
  constructor() {
    this.header = document.querySelector('header[data-sticky-header="true"]');
    this.isStickyEnabled = this.header?.dataset.stickyHeader === "true";
    this.scrollBehavior = this.header?.dataset.stickyScroll || "always_visible";

    this.lastScrollY = 0;
    this.scrollThreshold = 100; // 滚动阈值
    this.isScrollingDown = false;
    this.isScrollingUp = false;

    this.init();
  }

  init() {
    if (!this.isStickyEnabled || !this.header) {
      return;
    }

    // 添加 sticky 类
    this.header.classList.add("sticky");

    // 绑定滚动事件
    this.bindScrollEvent();

    // 初始化状态
    this.updateHeaderState();
  }

  bindScrollEvent() {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - this.lastScrollY;

    // 判断滚动方向
    this.isScrollingDown = scrollDelta > 0;
    this.isScrollingUp = scrollDelta < 0;

    // 更新 header 状态
    this.updateHeaderState();

    // 根据滚动行为处理
    this.handleScrollBehavior();

    this.lastScrollY = currentScrollY;
  }

  updateHeaderState() {
    const scrolled = window.scrollY > this.scrollThreshold;

    if (scrolled) {
      this.header.classList.add("scrolled");
    } else {
      this.header.classList.remove("scrolled");
    }
  }

  handleScrollBehavior() {
    switch (this.scrollBehavior) {
      case "hide_on_scroll_down":
        this.handleHideOnScrollDown();
        break;
      case "show_on_scroll_up":
        this.handleShowOnScrollUp();
        break;
      case "always_visible":
      default:
        this.handleAlwaysVisible();
        break;
    }
  }

  handleHideOnScrollDown() {
    if (this.isScrollingDown && window.scrollY > this.scrollThreshold) {
      this.header.classList.add("hide-on-scroll");
      this.header.classList.remove("show-on-scroll");
    } else if (this.isScrollingUp || window.scrollY <= this.scrollThreshold) {
      this.header.classList.remove("hide-on-scroll");
      this.header.classList.add("show-on-scroll");
    }
  }

  handleShowOnScrollUp() {
    if (this.isScrollingUp && window.scrollY > this.scrollThreshold) {
      this.header.classList.remove("hide-on-scroll");
      this.header.classList.add("show-on-scroll");
    } else if (this.isScrollingDown && window.scrollY > this.scrollThreshold) {
      this.header.classList.add("hide-on-scroll");
      this.header.classList.remove("show-on-scroll");
    } else if (window.scrollY <= this.scrollThreshold) {
      this.header.classList.remove("hide-on-scroll");
      this.header.classList.add("show-on-scroll");
    }
  }

  handleAlwaysVisible() {
    this.header.classList.remove("hide-on-scroll");
    this.header.classList.add("show-on-scroll");
  }

  // 公共方法：更新配置
  updateConfig(newConfig) {
    if (newConfig.stickyHeader !== undefined) {
      this.isStickyEnabled = newConfig.stickyHeader;
    }
    if (newConfig.stickyScroll !== undefined) {
      this.scrollBehavior = newConfig.stickyScroll;
    }

    // 重新初始化
    this.init();
  }

  // 公共方法：销毁
  destroy() {
    if (this.header) {
      this.header.classList.remove(
        "sticky",
        "scrolled",
        "hide-on-scroll",
        "show-on-scroll"
      );
    }
    window.removeEventListener("scroll", this.handleScroll);
  }
}

// 初始化 sticky header
document.addEventListener("DOMContentLoaded", () => {
  window.stickyHeader = new StickyHeader();
});

// 导出类供其他脚本使用
if (typeof module !== "undefined" && module.exports) {
  module.exports = StickyHeader;
}
