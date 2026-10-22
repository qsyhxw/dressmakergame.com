(function () {
  "use strict";
  // Display state only. The dashboard's original script runs directly in HTML.
  document.querySelectorAll("[data-adsterra-native]").forEach(function (wrapper) {
    if (wrapper.dataset.adInit) return;
    const container = wrapper.querySelector("#container-e650c65aadd95134c827779b7170fa6e");
    if (!container) return;
    wrapper.dataset.adInit = "true";
    function update() {
      const nativeCards = Array.from(container.getElementsByClassName(container.id + "__bn"));
      const filled = nativeCards.some(card => card.textContent.trim().length > 0) ||
        Array.from(container.querySelectorAll("img")).some(img =>
          img.complete && img.naturalWidth > 20 && img.naturalHeight > 20) ||
        Array.from(container.querySelectorAll("a[href]")).some(link =>
          link.textContent.trim().length > 0);
      wrapper.dataset.filled = String(filled);
      wrapper.setAttribute("aria-hidden", String(!filled));
    }
    new MutationObserver(update).observe(container, {
      childList: true, subtree: true, attributes: true, characterData: true
    });
    container.addEventListener("load", update, true);
    container.addEventListener("error", update, true);
    update();
  });
})();
