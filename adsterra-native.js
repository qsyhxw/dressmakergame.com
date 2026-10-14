(function () {
  "use strict";

  const containerId = "container-e650c65aadd95134c827779b7170fa6e";

  // Only control empty-slot visibility. The provider runs its original code directly.
  function initNativeAd(wrapper) {
    if (wrapper.dataset.adsterraInitialized === "true") return;
    const container = wrapper.querySelector("#" + containerId);
    if (!container) return;
    wrapper.dataset.adsterraInitialized = "true";

    function update() {
      const filled = Boolean(container.querySelector('a[href], img, iframe, [class*="__bn"]'));
      wrapper.hidden = !filled;
      wrapper.dataset.adsterraState = filled ? "ready" : "empty";
    }

    new MutationObserver(update).observe(container, {
      childList: true,
      subtree: true,
      attributes: true
    });
    container.addEventListener("load", update, true);
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
