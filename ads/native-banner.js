(function () {
  "use strict";

  const messageType = "dressmaker-native-ad-size";
  const containerId = "container-e650c65aadd95134c827779b7170fa6e";
  const adScriptUrl = "https://bauval.org/21/e650c65aadd95134c827779b7170fa6e";
  const parentOrigin = new URLSearchParams(location.hash.slice(1)).get("parentOrigin");
  const allowedParents = ["https://dressmakergame.com", "https://www.dressmakergame.com"];
  const localHost = (host) => host === "127.0.0.1" || host === "localhost";

  // Never run advertising code as a top-level page or on the main site's origin.
  if (window.parent === window || !parentOrigin || parentOrigin === location.origin) return;
  let parentUrl;
  try { parentUrl = new URL(parentOrigin); } catch (_) { return; }
  const localTest = localHost(location.hostname) && localHost(parentUrl.hostname);
  if (!allowedParents.includes(parentOrigin) && !localTest) return;
  if (parentUrl.origin !== parentOrigin) return;

  const container = document.getElementById(containerId);
  if (!container) return;
  let scheduled = false;
  let lastState = "";

  function send(data) {
    window.parent.postMessage(Object.assign({ type: messageType }, data), parentOrigin);
  }

  function update() {
    scheduled = false;
    const filled = Boolean(container.querySelector('a[href], img, iframe, [class*="__bn"]'));
    const height = Math.ceil(Math.max(container.scrollHeight, container.getBoundingClientRect().height));
    const state = filled + ":" + height;
    if (state === lastState) return;
    lastState = state;
    send({ filled: filled, height: height });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(update);
  }

  new MutationObserver(schedule).observe(container, { childList: true, subtree: true, attributes: true });
  new ResizeObserver(schedule).observe(container);
  container.addEventListener("load", schedule, true);
  window.addEventListener("resize", schedule);
  window.addEventListener("error", function (event) {
    if (event.message) send({ diagnostic: "runtime-error", detail: event.message.slice(0, 200) });
  });
  window.addEventListener("unhandledrejection", function (event) {
    send({ diagnostic: "runtime-error", detail: String(event.reason).slice(0, 200) });
  });
  const reportedBlocks = new Set();
  window.addEventListener("securitypolicyviolation", function (event) {
    const detail = event.disposition + ": " + event.effectiveDirective + ": " + event.blockedURI;
    if (reportedBlocks.has(detail) || reportedBlocks.size >= 10) return;
    reportedBlocks.add(detail);
    send({ diagnostic: event.disposition === "report" ? "resource-reported" : "resource-blocked", detail: detail.slice(0, 200) });
  });

  send({ diagnostic: "frame-ready" });
  schedule();
  const script = document.createElement("script");
  script.async = true;
  script.dataset.cfasync = "false";
  script.src = adScriptUrl;
  script.addEventListener("load", function () { send({ diagnostic: "script-loaded" }); });
  script.addEventListener("error", function () { send({ diagnostic: "script-load-failed" }); });
  document.body.appendChild(script);
})();
