document.documentElement.classList.add("has-js");

const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const links = [...navigation.querySelectorAll("a")];
const sections = links.map((link) => document.querySelector(link.hash));
const header = document.querySelector(".site-header");
const progress = document.querySelector(".progress");
const glow = document.querySelector(".pointer-glow");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function setMenu(open) {
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
}

menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") === "false"));
navigation.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  if (menu.getAttribute("aria-expanded") === "true") menu.focus({ preventScroll: true });
  setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menu.getAttribute("aria-expanded") !== "true") return;
  setMenu(false);
  menu.focus();
});

let scrollFrame = 0;
function updateScroll() {
  scrollFrame = 0;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0})`;
  header.classList.toggle("scrolled", scrollY > 12);

  const active = maxScroll > 0 && scrollY >= maxScroll - 2
    ? sections.at(-1)
    : sections.findLast((section) => section.getBoundingClientRect().top <= 110);
  links.forEach((link) => {
    if (link.hash === `#${active?.id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function scheduleScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}
addEventListener("scroll", scheduleScrollUpdate, { passive: true });
addEventListener("resize", scheduleScrollUpdate);
addEventListener("load", scheduleScrollUpdate);
updateScroll();

addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" || reducedMotion.matches) return;
  glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  glow.classList.add("active");
}, { passive: true });
document.documentElement.addEventListener("pointerleave", () => glow.classList.remove("active"));
reducedMotion.addEventListener("change", () => glow.classList.remove("active"));

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove("pending");
      revealObserver.unobserve(entry.target);
    }
  });

  for (const item of document.querySelectorAll(".reveal")) {
    if (item.getBoundingClientRect().top < innerHeight) continue;
    item.classList.add("pending");
    revealObserver.observe(item);
  }
}

const copyButton = document.querySelector(".copy-email");
const emailAddress = copyButton.querySelector(".email-address");
const copyStatus = document.querySelector(".copy-status");
let statusTimeout;

copyButton.addEventListener("click", async () => {
  clearTimeout(statusTimeout);
  try {
    await navigator.clipboard.writeText(emailAddress.textContent.trim());
    copyStatus.textContent = "邮箱已复制";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(emailAddress);
    selection.removeAllRanges();
    selection.addRange(range);
    copyStatus.textContent = "邮箱已选中，请手动复制";
  }
  statusTimeout = setTimeout(() => { copyStatus.textContent = ""; }, 3500);
});
