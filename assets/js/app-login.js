(function () {
  "use strict";

  var ERROR_MESSAGES = {
    state_mismatch: "Your login session expired before TikTok could confirm it. Please try again.",
    missing_params: "TikTok didn't return the expected login details. Please try again.",
    oauth_failed: "We couldn't complete the connection with TikTok. Please try again.",
    access_denied: "You declined the TikTok connection request.",
  };

  function showError(code) {
    var el = document.getElementById("auth-error");
    if (!el) return;
    el.textContent = ERROR_MESSAGES[code] || "Something went wrong connecting to TikTok. Please try again.";
    el.classList.add("visible");
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var error = params.get("error");
    if (error) showError(error);

    var btn = document.getElementById("tiktok-connect-btn");
    var alreadyConnected = false;

    if (btn) {
      btn.addEventListener("click", function () {
        btn.disabled = true;
        if (alreadyConnected) {
          window.location.href = "/app/dashboard.html";
          return;
        }
        btn.textContent = "Redirecting to TikTok…";
        window.location.href = "/auth/tiktok/start";
      });
    }

    fetch("/auth/session", { credentials: "include" })
      .then(function (res) {
        return res.ok ? res.json() : { connected: false };
      })
      .then(function (data) {
        if (data.connected && btn) {
          alreadyConnected = true;
          btn.textContent = "Go to dashboard";
        }
      })
      .catch(function () {
        /* session check is best-effort; the connect button still works if this fails */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
