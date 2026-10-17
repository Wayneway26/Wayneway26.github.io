/* Theme: persisted choice, system default as fallback, no flash on load. */
(function () {
  "use strict";

  var root = document.documentElement;
  var button = document.getElementById("themeToggle");
  var storageKey = "ww26:theme";
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function readStored() {
    try {
      return localStorage.getItem(storageKey);
    } catch (e) {
      return null;
    }
  }

  function apply(theme, persist) {
    var wantsTransition =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (wantsTransition) {
      root.classList.add("theme-shifting");
      window.clearTimeout(apply._timer);
      apply._timer = window.setTimeout(function () {
        root.classList.remove("theme-shifting");
      }, 300);
    }

    root.setAttribute("data-theme", theme);

    if (button) {
      var dark = theme === "dark";
      button.setAttribute("aria-pressed", dark ? "true" : "false");
      button.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme"
      );
    }

    if (persist) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch (e) {}
    }
  }

  apply(root.getAttribute("data-theme") || "light", false);

  if (button) {
    button.addEventListener("click", function () {
      apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  // Follow the OS only while the visitor has not made an explicit choice.
  var onSystemChange = function (event) {
    if (!readStored()) apply(event.matches ? "dark" : "light", false);
  };

  if (media.addEventListener) {
    media.addEventListener("change", onSystemChange);
  } else if (media.addListener) {
    media.addListener(onSystemChange);
  }
})();
