/* Motion: pointer-lit grid, cursor-tracking card borders, staged reveals. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;

  /* --- 1. Ambient grid follows the pointer ------------------------------ */
  var veil = document.querySelector(".grid-veil");
  if (veil && canHover && !reduce) {
    var px = 0;
    var py = 0;
    var frame = 0;

    document.addEventListener(
      "pointermove",
      function (event) {
        px = event.clientX;
        py = event.clientY;
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          veil.style.setProperty("--px", px + "px");
          veil.style.setProperty("--py", py + "px");
        });
      },
      { passive: true }
    );
  }

  /* --- 2. Cursor-tracking illumination on spotlit elements -------------- */
  var spotlit = document.querySelectorAll("[data-spotlight]");
  if (spotlit.length && canHover) {
    var queued = false;

    document.addEventListener(
      "pointermove",
      function (event) {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          var active = document.querySelectorAll("[data-spotlight]:hover");
          for (var i = 0; i < active.length; i += 1) {
            var box = active[i].getBoundingClientRect();
            active[i].style.setProperty("--mx", event.clientX - box.left + "px");
            active[i].style.setProperty("--my", event.clientY - box.top + "px");
          }
        });
      },
      { passive: true }
    );
  }

  /* --- 3. Staged reveals ------------------------------------------------ */
  var targets = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window) || reduce) {
    for (var i = 0; i < targets.length; i += 1) {
      targets[i].classList.add("is-visible");
    }
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* --- 4. Nav state + scrollspy ----------------------------------------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        nav.classList.toggle("is-scrolled", window.scrollY > 12);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var links = document.querySelectorAll(".nav__link[href^='#']");
  if (links.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    ["work", "log", "about"].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }
})();
