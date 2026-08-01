(function () {
  "use strict";

  window.addEventListener("load", function () {
    var loader = document.querySelector("[data-loader]");
    if (loader) loader.classList.add("hide");
  });

  document.addEventListener("click", function (e) {
    var navBtn = e.target.closest("[data-nav-toggle]");
    if (navBtn) {
      var panel = document.querySelector("[data-mobile-nav]");
      var open = panel && panel.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    var faqBtn = e.target.closest("[data-faq-trigger]");
    if (faqBtn) {
      var item = faqBtn.closest(".faq-item");
      var list = item && item.parentElement;
      if (list) {
        list.querySelectorAll(".faq-item.open").forEach(function (el) {
          if (el !== item) el.classList.remove("open");
        });
      }
      if (item) {
        var isOpen = item.classList.toggle("open");
        faqBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
    }
  });

  function normalize(p) {
    var s = (p || "").replace(/https?:\/\/[^/]+/i, "");
    s = s.split("?")[0].split("#")[0];
    if (!s || s === "/") return "/index.html";
    if (s.endsWith("/")) s += "index.html";
    return s;
  }
  var current = normalize(location.pathname);
  document.querySelectorAll("[data-nav] a, .mobile-panel a").forEach(function (link) {
    if (normalize(link.getAttribute("href") || "") === current) {
      link.setAttribute("aria-current", "page");
    }
  });

  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var subject = String(data.get("subject") || "Website inquiry").trim();
      var message = String(data.get("message") || "").trim();
      if (!name || !email || !message) return;
      var body = ["Name: " + name, "Email: " + email, "", message].join("\n");
      location.href =
        "mailto:support@balochsahab.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
      var ok = form.querySelector("[data-form-success]");
      if (ok) {
        ok.hidden = false;
        ok.classList.add("show");
      }
      form.reset();
    });
  }

  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
