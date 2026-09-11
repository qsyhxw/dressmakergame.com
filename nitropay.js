(function () {
  "use strict";

  var nitroAds = window.nitroAds;
  if (!nitroAds || typeof nitroAds.createAd !== "function") return;

  var reportTopRight = {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right"
  };

  var reportBottomRight = {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "bottom-right"
  };

  nitroAds.createAd("dressmaker_side_rail", {
    format: "rail",
    rail: "right",
    railOffsetTop: 0,
    railOffsetBottom: 0,
    railCollisionWhitelist: [],
    railCloseColor: "#666666",
    railSpacing: 10,
    railStack: false,
    railStickyTop: 69,
    railVerticalAlign: "top",
    mediaQuery: "(min-width: 1280px)",
    report: reportTopRight
  });

  var main = document.querySelector("main");
  if (!main) return;

  var anchors = Array.from(main.querySelectorAll("section"));
  var insertBefore = false;

  if (anchors.length < 3) {
    anchors = Array.from(main.querySelectorAll("article h2"));
    insertBefore = true;
  }
  if (anchors.length < 3) return;

  var insertionIndexes = anchors.length >= 7
    ? [Math.floor(anchors.length / 3), Math.floor(anchors.length * 2 / 3)]
    : [Math.floor(anchors.length / 2)];

  insertionIndexes.forEach(function (index, slotIndex) {
    var placementId = slotIndex === 0
      ? "dressmaker_in_content"
      : "dressmaker_in_content_2";
    var referenceElement = anchors[index];
    if (!referenceElement || document.getElementById(placementId)) return;

    var slot = document.createElement("div");
    slot.id = placementId;
    slot.className = "dressmaker-ad-slot mx-auto max-w-5xl px-4 my-8 text-center";
    slot.setAttribute("role", "complementary");
    slot.setAttribute("aria-label", "Advertisement");
    referenceElement.insertAdjacentElement(insertBefore ? "beforebegin" : "afterend", slot);

    nitroAds.createAd(placementId, {
      format: "display",
      sizes: [[970, 90], [970, 250], [728, 90], [300, 250], [320, 100], [320, 50]],
      height: 250,
      delayLoading: true,
      renderVisibleOnly: true,
      visibleMargin: 800,
      report: reportBottomRight
    });
  });
})();
