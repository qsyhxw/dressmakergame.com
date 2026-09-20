(function () {
  "use strict";

  const containerId = "container-e650c65aadd95134c827779b7170fa6e";

  if (!window.__adsterraPopupGuardInstalled) {
    window.__adsterraPopupGuardInstalled = true;
    const nativeWindowOpen = window.open;
    window.open = function (...args) {
      if (!navigator.userActivation || !navigator.userActivation.isActive) {
        return null;
      }
      return nativeWindowOpen.apply(window, args);
    };
  }

  function initNativeAd(wrapper) {
    if (wrapper.dataset.adsterraInitialized === "true") return;
    wrapper.dataset.adsterraInitialized = "true";

    const container = wrapper.querySelector(`#${containerId}`);
    if (!container) return;

    const update = () => {
      container.querySelectorAll("a").forEach((link) => {
        link.target = "_blank";
        link.rel = "noopener noreferrer sponsored nofollow";
      });

      const hasCreative = Boolean(
        container.querySelector('a[href], img, iframe, [class*="__bn"]')
      );
      wrapper.hidden = !hasCreative;
    };

    wrapper.addEventListener(
      "click",
      (event) => {
        if (!event.isTrusted) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true
    );

    const observer = new MutationObserver(update);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "class", "style"]
    });
    update();
  }

  function initAllNativeAds() {
    document.querySelectorAll("[data-adsterra-native]").forEach(initNativeAd);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllNativeAds, { once: true });
  } else {
    initAllNativeAds();
  }
})();
