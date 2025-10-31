(function () {
  "use strict";

  // Theme bootstrap: respect saved, else system
  const root = document.documentElement;
  const metaTheme = document.getElementById("meta-theme-color");
  const saved = localStorage.getItem("theme");
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (systemDark ? "dark" : "light");
  setTheme(initial);

  // Toggle handler
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem("theme", next);
    });
  }

  // Update theme color for mobile UI chrome
  function setTheme(mode) {
    if (mode === "auto") {
      root.setAttribute("data-theme", systemDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", mode);
    }
    const current = root.getAttribute("data-theme");
    if (metaTheme) metaTheme.content = current === "dark" ? "#05070a" : "#0ea5e9";
  }

  // Scroll progress
  const progressSpan = document.querySelector(".progress span");
  const onScroll = () => {
    if (!progressSpan) return;
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressSpan.style.width = ratio.toFixed(2) + "%";
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Intersection reveal
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }) : null;

  document.querySelectorAll(".reveal").forEach(el => {
    if (io) io.observe(el);
    else el.classList.add("is-visible");
  });

  // Filter chips (homepage only)
  const chips = Array.from(document.querySelectorAll(".chip"));
  const cards = Array.from(document.querySelectorAll(".project"));
  if (chips.length) {
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => {
          const active = c === chip;
          c.classList.toggle("is-active", active);
          c.setAttribute("aria-pressed", String(active));
        });
        const key = chip.dataset.filter;
        cards.forEach(card => {
          const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
          const show = key === "all" || tags.includes(key);
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  // Smooth anchor scrolling (reduced motion respected)
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced) {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href) return;
        const id = href.slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.offsetTop - 64, behavior: "smooth" });
        }
      });
    });
  }

  // Back to top visibility
  const backToTop = document.querySelector(".back-to-top");
  const toggleTop = () => {
    if (!backToTop) return;
    backToTop.style.opacity = window.scrollY > 400 ? "1" : "0.6";
  };
  document.addEventListener("scroll", toggleTop, { passive: true });
  toggleTop();

  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

  // Print resume button
  const printBtn = document.getElementById("print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  // Under Construction banner dismiss and persistence
  const uc = document.querySelector(".uc-banner");
  const ucDismissBtn = document.querySelector(".uc-dismiss");
  const UC_KEY = "uc_banner_dismissed";
  const ucDismissed = localStorage.getItem(UC_KEY) === "1";
  if (uc && ucDismissBtn) {
    if (ucDismissed) uc.style.display = "none";
    ucDismissBtn.addEventListener("click", () => {
      uc.style.display = "none";
      localStorage.setItem(UC_KEY, "1");
    });
  }

  // Active navigation state
  const activePage = document.body.dataset.page;
  if (activePage) {
    document.querySelectorAll(".nav a[data-nav]").forEach(link => {
      const isActive = link.dataset.nav === activePage;
      link.classList.toggle("is-current", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
})();
