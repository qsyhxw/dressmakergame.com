(function () {
  "use strict";

  // Verified Pages origin: serves directly without redirecting to the main site.
  const adFrameOrigin = "https://dressmakergame-com.pages.dev";
  const messageType = "dressmaker-native-ad-size";
  const maxHeight = 900;

  function getFrameUrl() {
    if (!adFrameOrigin) return null;
    const origin = new URL(adFrameOrigin);
    const localTest = (origin.hostname === "127.0.0.1" || origin.hostname === "localhost") &&
      (location.hostname === "127.0.0.1" || location.hostname === "localhost");
    if (origin.protocol !== "https:" && !(localTest && origin.protocol === "http:")) return null;
    if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
    if (origin.origin === location.origin) return null;
    const frameUrl = new URL("/ads/native-banner.html", origin.origin);
    frameUrl.searchParams.set("v", "20261008-origin3");
    frameUrl.hash = new URLSearchParams({ parentOrigin: location.origin }).toString();
    return frameUrl;
  }

  function initNativeAd(wrapper) {
    if (wrapper.dataset.adsterraInitialized === "true") return;
    const slot = wrapper.querySelector("[data-adsterra-slot]");
    if (!slot) return;
    wrapper.dataset.adsterraInitialized = "true";
    let frameUrl;
    try { frameUrl = getFrameUrl(); } catch (_) { frameUrl = null; }
    if (!frameUrl) {
      wrapper.hidden = true;
      wrapper.dataset.adsterraState = "configuration-required";
      console.warn("Adsterra: configure a different, HTTPS adFrameOrigin before enabling advertising.");
      return;
    }

    const frame = document.createElement("iframe");
    frame.title = "Sponsored content";
    // Safe only with a truly different origin. No popup or top-navigation permissions.
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.style.cssText = "display:block;width:100%;height:250px;border:0;";
    wrapper.hidden = false;
    wrapper.dataset.adsterraState = "loading";
    let filled = false;
    let loading = true;
    const loadingTimer = window.setTimeout(function () {
      loading = false;
      wrapper.hidden = !filled;
      wrapper.dataset.adsterraState = filled ? "ready" : "empty";
      if (!filled) console.warn("Adsterra: no creative received from the independent ad frame within 20 seconds.");
    }, 20000);

    window.addEventListener("message", function (event) {
      // Require both the configured origin and this specific frame window.
      if (event.source !== frame.contentWindow || event.origin !== frameUrl.origin) return;
      const data = event.data;
      if (!data || data.type !== messageType) return;
      if (typeof data.diagnostic === "string") {
        const valid = ["frame-ready", "script-loaded", "script-load-failed", "runtime-error", "resource-blocked", "resource-reported"];
        if (!valid.includes(data.diagnostic)) return;
        wrapper.dataset.adsterraDiagnostic = data.diagnostic;
        if (data.diagnostic === "resource-blocked") {
          const detail = typeof data.detail === "string" ? data.detail.slice(0, 200) : "";
          console.info("Adsterra CSP blocked an additional resource:", detail);
        }
        if (data.diagnostic === "resource-reported") {
          const detail = typeof data.detail === "string" ? data.detail.slice(0, 200) : "";
          console.info("Adsterra CSP diagnostic only (resource allowed):", detail);
        }
        if (data.diagnostic === "runtime-error") {
          const detail = typeof data.detail === "string" ? data.detail.slice(0, 200) : "";
          console.warn("Adsterra frame runtime error:", detail);
        }
        if (data.diagnostic === "script-load-failed") {
          window.clearTimeout(loadingTimer);
          loading = false;
          wrapper.hidden = !filled;
          wrapper.dataset.adsterraState = filled ? "ready" : "script-load-failed";
          console.warn("Adsterra: advertising script failed to load in the independent frame.");
        }
        return;
      }
      if (typeof data.filled !== "boolean" || typeof data.height !== "number" ||
          !Number.isFinite(data.height) || data.height < 0) return;
      filled = data.filled;
      if (filled) {
        loading = false;
        window.clearTimeout(loadingTimer);
        frame.style.height = Math.min(maxHeight, Math.max(1, Math.ceil(data.height))) + "px";
      }
      if (!loading) {
        wrapper.hidden = !filled;
        wrapper.dataset.adsterraState = filled ? "ready" : "empty";
      }
    });

    frame.src = frameUrl.href;
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
