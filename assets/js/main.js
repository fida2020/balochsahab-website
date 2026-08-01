/**
 * Baloch Sahab Automation — site interactions
 * Future modules: auth, dashboard, billing, API keys (see /app/)
 */
(function () {
  "use strict";

  const root = document.documentElement;
  const STORAGE_KEY = "bsa-theme";

  function preferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("title", theme === "dark" ? "Light mode" : "Dark mode");
    });
  }

  applyTheme(preferredTheme());

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-theme-toggle]");
    if (toggle) {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    }

    const navBtn = e.target.closest("[data-nav-toggle]");
    if (navBtn) {
      const panel = document.querySelector("[data-mobile-nav]");
      const open = panel && panel.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    const faqBtn = e.target.closest("[data-faq-trigger]");
    if (faqBtn) {
      const item = faqBtn.closest(".faq-item");
      const list = item && item.parentElement;
      if (list) {
        list.querySelectorAll(".faq-item.open").forEach((el) => {
          if (el !== item) el.classList.remove("open");
        });
      }
      if (item) {
        const open = item.classList.toggle("open");
        faqBtn.setAttribute("aria-expanded", open ? "true" : "false");
      }
    }
  });

  // Active nav (supports nested routes like /blog/index.html)
  const normalize = (p) => {
    let s = (p || "").replace(/https?:\/\/[^/]+/i, "");
    s = s.split("?")[0].split("#")[0];
    if (!s || s === "/") return "/index.html";
    if (s.endsWith("/")) s += "index.html";
    return s;
  };
  const current = normalize(location.pathname);
  document.querySelectorAll("[data-nav] a, .mobile-panel a").forEach((link) => {
    const href = normalize(link.getAttribute("href") || "");
    if (href === current) link.setAttribute("aria-current", "page");
  });

  // Contact form → mailto (static hosting)
  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const company = String(data.get("company") || "").trim();
      const service = String(data.get("service") || "").trim();
      const subject = String(data.get("subject") || service || "Website inquiry").trim();
      const message = String(data.get("message") || "").trim();
      if (!name || !email || !message) return;

      const lines = [`Name: ${name}`, `Email: ${email}`];
      if (company) lines.push(`Company: ${company}`);
      if (service) lines.push(`Service: ${service}`);
      lines.push("", message);

      const mailto = `mailto:shamsfida92@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      window.location.href = mailto;

      const ok = form.querySelector("[data-form-success]");
      if (ok) {
        ok.hidden = false;
        ok.classList.add("show");
      }
      form.reset();
    });
  }

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // Year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
