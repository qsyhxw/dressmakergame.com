(function () {
  "use strict";
  // The account script is loaded separately, directly from Nitro.
  if (window.dressmakerNitroInitialized) return;
  window.dressmakerNitroInitialized = true;
  const slots = Array.from(document.querySelectorAll("[data-nitro-slot]"));
  const byId = new Map(slots.map(slot => [slot.querySelector(".nitro-slot-target").id, slot]));

  // Empty scaffolding/iframes are not evidence of a filled advertisement.
  // Listen before createAd so a fast render cannot be missed.
  document.addEventListener("nitroAds.rendered", function (event) {
    const detail = event.detail;
    const slot = byId.get(detail?.adInfo?.adUnitCode);
    if (!slot) return;
    const filled = Boolean(detail.type && detail.type !== "blank");
    slot.dataset.filled = String(filled);
    slot.setAttribute("aria-hidden", String(!filled));
  });

  function load(slot) {
    if (slot.dataset.requested) return;
    const width = slot.getBoundingClientRect().width;
    const sizes = [[970, 90], [728, 90], [336, 280], [300, 250], [320, 100], [320, 50]]
      .filter(size => size[0] <= width);
    if (!sizes.length || !window.nitroAds) return;
    slot.dataset.requested = "true";
    const id = slot.querySelector(".nitro-slot-target").id;
    try {
      // Our observer handles lazy loading. Provider visibility gating would
      // otherwise wait forever for the initially collapsed wrapper to open.
      Promise.resolve(window.nitroAds.createAd(id, {
        format: "display", sizes: sizes,
        delayLoading: false, renderVisibleOnly: false,
        report: { enabled: true, icon: true, wording: "Report Ad", position: "bottom-right" }
      })).catch(() => { slot.dataset.error = "true"; });
    } catch (_) { slot.dataset.error = "true"; }
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) load(entry.target); });
    }, { rootMargin: "600px 0px" });
    slots.forEach(slot => observer.observe(slot));
  } else { slots.forEach(load); }
})();
