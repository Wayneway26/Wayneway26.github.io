/* Interactive profile terminal. Commands are data, not markup. */
(function () {
  "use strict";

  var body = document.getElementById("terminalBody");
  var input = document.getElementById("terminalInput");
  if (!body || !input) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COMMANDS = {
    whoami: [
      { text: "Wayne — software engineer.", style: "key" },
      { text: "Heritage data systems, agent runtimes, and the tooling between them.", style: "dim" }
    ],
    stack: [
      { text: "languages   Java 21 · Python 3.13 · TypeScript" },
      { text: "data        MySQL 8 · Redis 7" },
      { text: "runtime     Spring Boot · Docker Compose · Nginx" },
      { text: "client      WeChat mini program · vanilla web" },
      { text: "deploy      GitHub Pages — static, no build output", style: "dim" }
    ],
    now: [
      { text: "Wuxi Jiahua mini program — payments and exhibition module." },
      { text: "Agent world model prototype — skills, roles, evaluation." },
      { text: "This site — rewritten with zero dependencies.", style: "dim" }
    ],
    principles: [
      { text: "1. Provenance over plausibility. A marked gap beats a guessed value." },
      { text: "2. Runnable beats well-described. Execute it before arguing about it." },
      { text: "3. Incremental and reversible. Name the rollback point first.", style: "dim" }
    ],
    contact: [
      { text: "github.com/Wayneway26 — issues and pull requests are the fastest route." }
    ],
    help: [{ text: "whoami · stack · now · principles · contact", style: "dim" }]
  };

  function print(text, style) {
    var line = document.createElement("div");
    line.className =
      "t-line" + (style === "cmd" ? " t-line--cmd" : style === "dim" ? " t-line--dim" : style === "key" ? " t-line--key" : "");

    if (style === "cmd") {
      var prompt = document.createElement("span");
      prompt.className = "t-prompt";
      prompt.textContent = "$ ";
      line.appendChild(prompt);
      line.appendChild(document.createTextNode(text));
    } else {
      line.textContent = text;
    }

    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
    return line;
  }

  function emit(command) {
    var key = command.trim().toLowerCase();

    if (!key) return;

    if (COMMANDS[key]) {
      COMMANDS[key].forEach(function (item) {
        print(item.text, item.style);
      });
    } else {
      print("sh: command not found: " + key, "dim");
      print("try: help", "dim");
    }
  }

  var busy = false;

  function run(command) {
    if (busy) return;
    busy = true;

    print(command, "cmd");

    if (reduce) {
      emit(command);
      busy = false;
      return;
    }

    var index = 0;
    input.textContent = "";

    var timer = window.setInterval(function () {
      index += 1;
      input.textContent = command.slice(0, index);
      if (index < command.length) return;
      window.clearInterval(timer);

      window.setTimeout(function () {
        input.textContent = "";
        emit(command);
        busy = false;
      }, 180);
    }, 42);
  }

  document.querySelectorAll(".hint").forEach(function (hint) {
    hint.addEventListener("click", function () {
      run(hint.getAttribute("data-cmd"));
    });
  });

  // Open with a short handshake once the terminal is on screen.
  var greeted = false;
  var greet = function () {
    if (greeted) return;
    greeted = true;
    var weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
    print(
      "Last login: " + weekday + ", from a laptop that hasn't rebooted in weeks.",
      "dim"
    );
    run("whoami");
  };

  if (!("IntersectionObserver" in window)) {
    greet();
  } else {
    var watcher = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          watcher.unobserve(entry.target);
          window.setTimeout(greet, 260);
        });
      },
      { threshold: 0.25 }
    );
    watcher.observe(document.getElementById("about"));
  }
})();
