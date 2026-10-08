(function () {
  "use strict";

  const containerId = "container-e650c65aadd95134c827779b7170fa6e";
  const adScriptUrl = "https://bauval.org/21/e650c65aadd95134c827779b7170fa6e";
  const messageType = "dressmaker-native-ad-size";
  const maxHeight = 900;

  // Runs inside the opaque-origin frame. Only layout messages cross the sandbox.
  function observeAd(containerId, messageType) {
    const container = document.getElementById(containerId);
    let scheduled = false;
    let lastState = "";

    function update() {
      scheduled = false;
      const filled = Boolean(
        container.querySelector('a[href], img, iframe, [class*="__bn"]')
      );
      const height = Math.ceil(Math.max(
        container.scrollHeight,
        container.getBoundingClientRect().height
      ));
      const state = filled + ":" + height;
      if (state === lastState) return;
      lastState = state;
      parent.postMessage({ type: messageType, filled: filled, height: height }, "*");
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      // Hidden frames may pause animation callbacks; still report the first fill.
      queueMicrotask(update);
    }

    new MutationObserver(schedule).observe(container, {
      childList: true,
      subtree: true,
      attributes: true
    });
    new ResizeObserver(schedule).observe(container);
    container.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();
  }

  function initNativeAd(wrapper) {
    if (wrapper.dataset.adsterraInitialized === "true") return;
    const slot = wrapper.querySelector("[data-adsterra-slot]");
    if (!slot) return;
    wrapper.dataset.adsterraInitialized = "true";

    const frame = document.createElement("iframe");
    frame.title = "Sponsored content";
    // Do not add same-origin, popup or top-navigation permissions.
    // Links opening new tabs are intentionally blocked along with popunders.
    frame.setAttribute("sandbox", "allow-scripts");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.style.cssText = "display:block;width:100%;height:1px;border:0;";

    window.addEventListener("message", function (event) {
      // An opaque srcdoc origin is "null"; validate the sending window instead.
      if (event.source !== frame.contentWindow || event.origin !== "null") return;
      const data = event.data;
      if (!data || data.type !== messageType || typeof data.filled !== "boolean") return;
      if (typeof data.height !== "number" || !Number.isFinite(data.height) || data.height < 0) return;
      frame.style.height = Math.min(maxHeight, Math.max(1, Math.ceil(data.height))) + "px";
      wrapper.hidden = !data.filled;
    });

    frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>html,body{margin:0;padding:0;background:transparent;}' +
      'body{font:14px/1.5 system-ui,sans-serif;color:#1d1d1f;}' +
      'img{max-width:100%;}</style></head><body>' +
      '<div id="' + containerId + '"></div>' +
      '<script>(' + observeAd.toString() + ')(' +
      JSON.stringify(containerId) + ',' + JSON.stringify(messageType) + ');<\/script>' +
      '<script async data-cfasync="false" src="' + adScriptUrl + '"><\/script>' +
      '</body></html>';
    slot.replaceChildren(frame);
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
