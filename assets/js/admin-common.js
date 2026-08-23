// Shared helpers for every admin-*.html page. These pages are intentionally
// outside the scripts/build-site.ps1 pipeline (see admin.html's header
// comment) — this file is their one piece of shared code, loaded via a
// plain <script src> tag, not a module.
(function () {
  "use strict";

  var API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) || "";

  function getSession() {
    try {
      var raw = window.localStorage.getItem("bs_admin_session");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    window.localStorage.removeItem("bs_admin_session");
  }

  // Redirects to the login page if there's no session, otherwise returns it.
  // Call this once at the top of each page before rendering anything.
  function requireSession() {
    var session = getSession();
    if (!session || !session.accessToken) {
      window.location.href = "/admin-login.html";
      return null;
    }
    return session;
  }

  // fetch wrapper: adds the bearer token, parses the JSON envelope, and
  // redirects to login on a 401 (12h token expiry — no refresh, single
  // owner, see admin_panel memory/plan for why).
  function apiFetch(path, opts) {
    opts = opts || {};
    var session = getSession();
    var headers = { "Content-Type": "application/json" };
    if (session && session.accessToken) headers.Authorization = "Bearer " + session.accessToken;
    return fetch(API_BASE + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (res) {
      if (res.status === 401) {
        clearSession();
        window.location.href = "/admin-login.html";
        return Promise.reject(new Error("Session expired"));
      }
      return res.json().then(function (json) {
        if (!json || !json.ok) {
          var err = json && json.error;
          return Promise.reject(new Error((err && err.message) || "Request failed"));
        }
        return json.data;
      });
    });
  }

  function formatMinor(minor) {
    var major = (minor || 0) / 100000;
    var sign = major < 0 ? "-" : "";
    return sign + "$" + Math.abs(major).toFixed(5);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function logout() {
    clearSession();
    window.location.href = "/admin-login.html";
  }

  function wireLogoutButton(id) {
    var btn = document.getElementById(id || "logoutBtn");
    if (btn) btn.addEventListener("click", logout);
  }

  window.AdminApp = {
    getSession: getSession,
    requireSession: requireSession,
    apiFetch: apiFetch,
    formatMinor: formatMinor,
    escapeHtml: escapeHtml,
    logout: logout,
    wireLogoutButton: wireLogoutButton,
  };
})();
