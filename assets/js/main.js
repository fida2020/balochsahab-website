(function () {
  "use strict";

  // Prefer reduced motion: skip decorative reveal delays
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Nav active state
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

  // Mobile nav
  document.addEventListener("click", function (e) {
    var navBtn = e.target.closest("[data-nav-toggle]");
    if (navBtn) {
      var panel = document.querySelector("[data-mobile-nav]");
      var open = panel && panel.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      return;
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

  // Contact form — GitHub Pages compatible (mailto + optional Formspree)
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phoneRe = /^[+]?[\d\s().-]{7,20}$/;

    function showError(el, msg) {
      var id = el.getAttribute("id") || el.getAttribute("name");
      var box = form.querySelector('[data-error-for="' + id + '"]');
      if (box) {
        box.textContent = msg || "";
        box.hidden = !msg;
      }
      el.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    function clearErrors() {
      form.querySelectorAll("[data-error-for]").forEach(function (n) {
        n.hidden = true;
        n.textContent = "";
      });
      form.querySelectorAll("[aria-invalid]").forEach(function (n) {
        n.setAttribute("aria-invalid", "false");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();

      var data = new FormData(form);
      // Honeypot — bots fill this
      if (String(data.get("website") || "").trim()) {
        form.querySelector("[data-form-success]").hidden = false;
        form.reset();
        return;
      }

      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var company = String(data.get("company") || "").trim();
      var phone = String(data.get("phone") || "").trim();
      var subject = String(data.get("subject") || "Website inquiry").trim();
      var message = String(data.get("message") || "").trim();
      var dept = String(data.get("department") || "support").trim().toLowerCase();
      var ok = true;

      if (name.length < 2) {
        showError(form.querySelector('[name="name"]'), "Please enter your name.");
        ok = false;
      }
      if (!emailRe.test(email)) {
        showError(form.querySelector('[name="email"]'), "Enter a valid email address.");
        ok = false;
      }
      if (phone && !phoneRe.test(phone)) {
        showError(form.querySelector('[name="phone"]'), "Enter a valid phone number.");
        ok = false;
      }
      if (message.length < 10) {
        showError(form.querySelector('[name="message"]'), "Message must be at least 10 characters.");
        ok = false;
      }
      if (!ok) {
        var err = form.querySelector("[data-form-error]");
        if (err) {
          err.hidden = false;
          err.textContent = "Please fix the highlighted fields.";
        }
        return;
      }

      var errBox = form.querySelector("[data-form-error]");
      if (errBox) errBox.hidden = true;

      var inboxMap = {
        support: "support@balochsahab.com",
        sales: "sales@balochsahab.com",
        billing: "billing@balochsahab.com",
        info: "info@balochsahab.com",
        careers: "careers@balochsahab.com",
        hello: "hello@balochsahab.com"
      };
      var to = inboxMap[dept] || "support@balochsahab.com";

      var body = [
        "Name: " + name,
        "Email: " + email,
        "Company: " + (company || "—"),
        "Phone: " + (phone || "—"),
        "Department: " + dept,
        "",
        message
      ].join("\n");

      var endpoint = form.getAttribute("data-form-endpoint");
      if (endpoint) {
        // Optional Formspree / Getform / Basin endpoint
        fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data
        })
          .then(function (res) {
            if (!res.ok) throw new Error("submit failed");
            var okEl = form.querySelector("[data-form-success]");
            if (okEl) {
              okEl.hidden = false;
              okEl.classList.add("show");
            }
            form.reset();
          })
          .catch(function () {
            if (errBox) {
              errBox.hidden = false;
              errBox.textContent = "Could not send right now. Opening your email client instead.";
            }
            location.href =
              "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
          });
        return;
      }

      location.href =
        "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var okEl = form.querySelector("[data-form-success]");
      if (okEl) {
        okEl.hidden = false;
        okEl.classList.add("show");
      }
      form.reset();
    });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("visible");
    });
  } else if (reveals.length) {
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
    reveals.forEach(function (el) {
      io.observe(el);
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
