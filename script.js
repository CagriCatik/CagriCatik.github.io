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

  // Hero Three.js background
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas && window.THREE && !prefersReduced) {
    const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0, 4);

    const coreGeometry = new THREE.IcosahedronGeometry(1.3, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.45 });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const shellGeometry = new THREE.SphereGeometry(2.4, 64, 32);
    const shellMaterial = new THREE.PointsMaterial({ color: 0x0ea5e9, size: 0.04, transparent: true, opacity: 0.5 });
    const shell = new THREE.Points(shellGeometry, shellMaterial);
    scene.add(shell);

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const directional = new THREE.DirectionalLight(0x38bdf8, 1.2);
    directional.position.set(2, 2, 3);
    scene.add(ambient, directional);

    const clock = new THREE.Clock();
    const pointer = new THREE.Vector2(0, 0);

    function resize() {
      const host = heroCanvas.parentElement;
      const width = host ? host.clientWidth : window.innerWidth;
      const height = host ? host.clientHeight : window.innerHeight * 0.6;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate() {
      const delta = clock.getDelta();
      core.rotation.x += delta * 0.3;
      core.rotation.y += delta * 0.2;
      shell.rotation.y -= delta * 0.1;
      camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (pointer.y * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);

    window.addEventListener("pointermove", (event) => {
      const target = heroCanvas.parentElement || heroCanvas;
      const bounds = target.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
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
