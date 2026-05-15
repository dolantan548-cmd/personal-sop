(function shellBootstrap() {
  function routeFromHash(hash) {
    return (hash || "#/")
      .replace(/^#\//, "")
      .replace(/\?.*$/, "")
      .replace(/#.*/, "");
  }

  function titleFromRoute(route) {
    if (!route || route === "_index") return "SOP Index";
    var slug = decodeURIComponent(route)
      .replace(/\.md$/i, "")
      .replace(/^\/+/, "")
      .split("/")
      .pop();
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (char) {
        return char.toUpperCase();
      });
  }

  function syncDocMeta(route) {
    var pathNode = document.getElementById("doc-path");
    var titleNode = document.getElementById("doc-title");

    if (pathNode) {
      pathNode.textContent = route && route !== "_index" ? "Personal SOP / " + route : "Personal SOP / Index";
    }

    if (titleNode) {
      titleNode.textContent = titleFromRoute(route);
    }
  }

  function syncShellMode() {
    var home = document.getElementById("sop-home");
    var docs = document.getElementById("app");
    var docMeta = document.getElementById("doc-meta");
    var hash = window.location.hash || "#/";
    var route = routeFromHash(hash);
    var isHome = hash === "#/" || hash === "" || hash === "#";

    if (home) home.hidden = !isHome;
    if (docMeta) docMeta.hidden = isHome;
    if (docs) docs.classList.toggle("docs-mode", !isHome);

    document.body.classList.toggle("is-home", isHome);
    document.body.classList.toggle("is-docs", !isHome);

    if (!isHome) syncDocMeta(route);
  }

  function initMeteorLayer() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var layer = document.querySelector(".meteor-layer");
    if (!layer || layer.childElementCount) return;

    var meteorCount = window.matchMedia("(max-width: 768px)").matches ? 3 : 6;

    for (var i = 0; i < meteorCount; i += 1) {
      var node = document.createElement("span");
      node.className = "meteor";
      node.style.left = 14 + i * 13 + "%";
      node.style.top = -18 - i * 8 + "%";
      node.style.animationDelay = i * 1.8 + "s";
      node.style.animationDuration = 11 + i * 1.1 + "s";
      layer.appendChild(node);
    }
  }

  function initPointerTrail() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    var trail = document.querySelector(".pointer-trail");
    if (!trail) return;

    var raf = 0;
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;

    function draw() {
      trail.style.transform = "translate(" + (x - 85) + "px, " + (y - 85) + "px)";
      raf = 0;
    }

    window.addEventListener("pointermove", function onPointerMove(event) {
      x = event.clientX;
      y = event.clientY;
      trail.style.opacity = "0.34";
      if (!raf) raf = requestAnimationFrame(draw);
    });

    window.addEventListener("pointerleave", function onPointerLeave() {
      trail.style.opacity = "0";
    });
  }

  window.addEventListener("hashchange", syncShellMode);
  window.addEventListener("DOMContentLoaded", function onReady() {
    syncShellMode();
    initMeteorLayer();
    initPointerTrail();
  });
})();
