// Real client for the Baloch Sahab earning platform.
// Every function here calls the real, live EarnBox backend
// (window.APP_CONFIG.apiBaseUrl) — the exact same REST API the EarnBox
// mobile app uses. No mock data, no fake completions: every reward shown
// here only appears after the backend has verified it.
(function () {
  "use strict";

  var API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) || "";
  var SESSION_KEY = "bs_session"; // { user, accessToken, refreshToken }

  // ---------------------------------------------------------------------
  // Session storage
  // ---------------------------------------------------------------------
  function getSession() {
    try {
      var raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function setSession(session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
  }
  function isLoggedIn() {
    var s = getSession();
    return !!(s && s.accessToken);
  }

  // ---------------------------------------------------------------------
  // API client — real fetch against the real backend, envelope-aware,
  // with a single automatic refresh-and-retry on a 401.
  // ---------------------------------------------------------------------
  function ApiError(status, code, message) {
    this.status = status;
    this.code = code;
    this.message = message;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function rawFetch(path, opts) {
    opts = opts || {};
    var session = getSession();
    var headers = { "Content-Type": "application/json" };
    if (opts.auth !== false && session && session.accessToken) {
      headers["Authorization"] = "Bearer " + session.accessToken;
    }
    return fetch(API_BASE + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (json) {
        return { res: res, json: json };
      });
    });
  }

  function refreshSession() {
    var session = getSession();
    if (!session || !session.refreshToken) return Promise.reject(new ApiError(401, "NO_SESSION", "Not logged in"));
    return rawFetch("/auth/refresh", { method: "POST", auth: false, body: { refreshToken: session.refreshToken } }).then(function (r) {
      if (!r.res.ok || !r.json || !r.json.ok) {
        clearSession();
        throw new ApiError(401, "SESSION_EXPIRED", "Your session expired — please log in again");
      }
      var next = { user: session.user, accessToken: r.json.data.accessToken, refreshToken: r.json.data.refreshToken };
      setSession(next);
      return next;
    });
  }

  function api(path, opts) {
    return rawFetch(path, opts).then(function (r) {
      if (r.res.status === 401 && opts && opts.auth !== false && getSession()) {
        return refreshSession().then(function () {
          return rawFetch(path, opts);
        }).then(unwrap);
      }
      return unwrap(r);
    });
    function unwrap(r) {
      if (!r.res.ok || !r.json || !r.json.ok) {
        var err = r.json && r.json.error;
        throw new ApiError(r.res.status, (err && err.code) || "UNKNOWN_ERROR", (err && err.message) || "Request failed");
      }
      return r.json.data;
    }
  }

  // ---------------------------------------------------------------------
  // Money formatting — 1 minor unit = $0.00001 (backend's ledger.service.ts
  // is the source of truth for this scale), shown to 5 decimal places so
  // sub-cent rewards (e.g. AdsLab's $0.001 per view) are visible.
  // ---------------------------------------------------------------------
  function formatMinor(minor, currency) {
    var major = (minor || 0) / 100000;
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(major);
    } catch (e) {
      return "$" + major.toFixed(5);
    }
  }

  // ---------------------------------------------------------------------
  // Nav auth-state
  // ---------------------------------------------------------------------
  function refreshNavAuthState() {
    var guestSlots = document.querySelectorAll('[data-auth="guest"]');
    var userSlots = document.querySelectorAll('[data-auth="user"]');
    var loggedIn = isLoggedIn();
    for (var i = 0; i < guestSlots.length; i++) guestSlots[i].hidden = loggedIn;
    for (var j = 0; j < userSlots.length; j++) userSlots[j].hidden = !loggedIn;

    var earnGuest = document.querySelectorAll("[data-earn-guest]");
    var earnUser = document.querySelectorAll("[data-earn-user]");
    for (var k = 0; k < earnGuest.length; k++) earnGuest[k].hidden = loggedIn;
    for (var m = 0; m < earnUser.length; m++) earnUser[m].hidden = !loggedIn;

    if (loggedIn) {
      api("/wallet/summary").then(function (summary) {
        var pills = document.querySelectorAll("[data-balance-pill]");
        for (var i2 = 0; i2 < pills.length; i2++) pills[i2].textContent = formatMinor(summary.availableBalanceMinor, summary.currency);
      }).catch(function () {});
    }

    var logoutBtns = document.querySelectorAll("[data-logout]");
    for (var n = 0; n < logoutBtns.length; n++) {
      logoutBtns[n].addEventListener("click", function (e) {
        e.preventDefault();
        var session = getSession();
        if (session && session.refreshToken) {
          rawFetch("/auth/logout", { method: "POST", auth: false, body: { refreshToken: session.refreshToken } }).catch(function () {});
        }
        clearSession();
        window.location.href = "/index.html";
      });
    }
  }

  // ---------------------------------------------------------------------
  // Google Sign-In (real Google Identity Services + real /auth/google) —
  // only initializes when a real Web Client ID is configured.
  // ---------------------------------------------------------------------
  function initGoogleSignIn() {
    var clientId = window.APP_CONFIG && window.APP_CONFIG.googleClientId;
    var slots = document.querySelectorAll("[data-google-signin-slot]");
    if (!clientId) {
      // Not configured yet — stay hidden rather than showing a button
      // that can't actually authenticate anyone.
      return;
    }
    for (var i = 0; i < slots.length; i++) slots[i].hidden = false;

    function onCredential(response) {
      var refCode = new URLSearchParams(window.location.search).get("ref") || undefined;
      api("/auth/google", { method: "POST", auth: false, body: { idToken: response.credential, referredByCode: refCode } })
        .then(function (data) {
          setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
          window.location.href = "/earn.html";
        })
        .catch(function (err) {
          showFormError("[data-login-error], [data-signup-error]", err.message || "Google sign-in failed");
        });
    }

    function render() {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        window.setTimeout(render, 200);
        return;
      }
      window.google.accounts.id.initialize({ client_id: clientId, callback: onCredential });
      var loginTarget = document.getElementById("google-signin-login");
      var signupTarget = document.getElementById("google-signin-signup");
      if (loginTarget) window.google.accounts.id.renderButton(loginTarget, { theme: "outline", size: "large", width: 320, text: "signin_with" });
      if (signupTarget) window.google.accounts.id.renderButton(signupTarget, { theme: "outline", size: "large", width: 320, text: "signup_with" });
    }
    render();
  }

  function showFormError(selector, message) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = message;
      els[i].hidden = false;
    }
  }

  // ---------------------------------------------------------------------
  // Auth forms
  // ---------------------------------------------------------------------
  function initAuthForms() {
    var loginForm = document.querySelector("[data-login-form]");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(loginForm);
        api("/auth/login", { method: "POST", auth: false, body: { email: fd.get("email"), password: fd.get("password") } })
          .then(function (data) {
            setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
            window.location.href = "/earn.html";
          })
          .catch(function (err) { showFormError("[data-login-error]", err.message || "Could not log in"); });
      });
    }

    var signupForm = document.querySelector("[data-signup-form]");
    if (signupForm) {
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(signupForm);
        var refCode = new URLSearchParams(window.location.search).get("ref") || undefined;
        api("/auth/register", { method: "POST", auth: false, body: { email: fd.get("email"), password: fd.get("password"), referredByCode: refCode } })
          .then(function (data) {
            setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
            window.location.href = "/verify-email.html";
          })
          .catch(function (err) { showFormError("[data-signup-error]", err.message || "Could not create account"); });
      });
    }

    var forgotForm = document.querySelector("[data-forgot-form]");
    if (forgotForm) {
      forgotForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(forgotForm);
        api("/auth/password-reset/request", { method: "POST", auth: false, body: { email: fd.get("email") } })
          .then(function () { document.querySelector("[data-forgot-success]").hidden = false; })
          .catch(function (err) { showFormError("[data-forgot-error]", err.message || "Could not send reset link"); });
      });
    }

    var resetForm = document.querySelector("[data-reset-form]");
    if (resetForm) {
      resetForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(resetForm);
        var token = new URLSearchParams(window.location.search).get("token");
        if (!token) { showFormError("[data-reset-error]", "Missing reset token — use the link from your email"); return; }
        api("/auth/password-reset/confirm", { method: "POST", auth: false, body: { token: token, newPassword: fd.get("newPassword") } })
          .then(function () { resetForm.hidden = true; document.querySelector("[data-reset-success]").hidden = false; })
          .catch(function (err) { showFormError("[data-reset-error]", err.message || "Could not reset password"); });
      });
    }

    var verifyForm = document.querySelector("[data-verify-form]");
    if (verifyForm) {
      verifyForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(verifyForm);
        api("/users/me/verify-email", { method: "POST", body: { otp: fd.get("otp") } })
          .then(function () {
            verifyForm.hidden = true;
            document.querySelector("[data-verify-success]").hidden = false;
            window.setTimeout(function () { window.location.href = "/earn.html"; }, 1500);
          })
          .catch(function (err) { showFormError("[data-verify-error]", err.message || "Invalid code"); });
      });
      var resendBtn = document.querySelector("[data-resend-verification]");
      if (resendBtn) {
        resendBtn.addEventListener("click", function () {
          api("/users/me/resend-verification-email", { method: "POST" }).catch(function () {});
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Earn page
  // ---------------------------------------------------------------------
  function initEarnPage() {
    // PTC, Shortlinks, Offerwall, Games, and Video Ads are marked "Coming
    // Soon" in earn.html for now — this backend (baloch-sahab-backend) is
    // a separate system from EarnBox's and doesn't have real ad/offer
    // provider integrations wired up yet. Only Daily Check-in and Faucet
    // (pure internal logic, no third party) are real and live below.

    if (!isLoggedIn()) {
      var guestDailyStatus = document.querySelector("[data-daily-status]");
      var guestDailyBtn = document.querySelector("[data-daily-claim]");
      if (guestDailyStatus) { guestDailyStatus.innerHTML = 'Log in to see today\'s bonus — <a href="/login.html">Log In</a>'; }
      if (guestDailyBtn) guestDailyBtn.hidden = true;
      var guestFaucetStatus = document.querySelector("[data-faucet-status]");
      var guestFaucetBtn = document.querySelector("[data-faucet-claim]");
      if (guestFaucetStatus) { guestFaucetStatus.innerHTML = 'Log in to claim the faucet reward — <a href="/login.html">Log In</a>'; }
      if (guestFaucetBtn) guestFaucetBtn.hidden = true;
      var guestTaskStatuses = document.querySelectorAll("[data-tasklist-status]");
      for (var g = 0; g < guestTaskStatuses.length; g++) {
        guestTaskStatuses[g].innerHTML = 'Log in to view available tasks — <a href="/login.html">Log In</a>';
      }
      var guestVideoStatus = document.querySelector("[data-video-status]");
      if (guestVideoStatus) { guestVideoStatus.innerHTML = 'Log in to watch video ads — <a href="/login.html">Log In</a>'; }
      var guestInterstitialStatus = document.querySelector("[data-interstitial-status]");
      if (guestInterstitialStatus) { guestInterstitialStatus.innerHTML = 'Log in to view interstitial ads — <a href="/login.html">Log In</a>'; }
      var guestSpinStatus = document.querySelector("[data-spin-status]");
      if (guestSpinStatus) { guestSpinStatus.innerHTML = 'Log in to spin — <a href="/login.html">Log In</a>'; }
      return;
    }

    // Daily check-in
    var dailyRoot = document.querySelector("[data-daily-root]");
    if (dailyRoot) {
      var dailyStatusEl = document.querySelector("[data-daily-status]");
      var dailyClaimBtn = document.querySelector("[data-daily-claim]");
      function renderDaily(status) {
        if (!status.enabled) { dailyStatusEl.textContent = "The daily check-in is not currently available."; return; }
        if (status.claimedToday) {
          dailyStatusEl.textContent = "Already claimed today. Current streak: " + status.currentStreak + " day(s).";
          dailyClaimBtn.hidden = true;
        } else {
          dailyStatusEl.textContent = "Today's bonus: " + formatMinor(status.nextRewardMinor) + ". Streak: " + status.currentStreak + " day(s).";
          dailyClaimBtn.hidden = false;
        }
      }
      dailyClaimBtn.addEventListener("click", function () {
        dailyClaimBtn.disabled = true;
        api("/daily-bonus/claim", { method: "POST" }).then(function (result) {
          dailyStatusEl.textContent = "Claimed: " + formatMinor(result.rewardMinor) + " — streak " + result.streakCount + " day(s).";
          dailyClaimBtn.hidden = true;
          dailyClaimBtn.disabled = false;
          refreshNavAuthState();
        }).catch(function (err) {
          dailyClaimBtn.disabled = false;
          dailyStatusEl.textContent = err.message || "Could not claim daily bonus";
        });
      });
      api("/daily-bonus/status").then(renderDaily).catch(function (err) { dailyStatusEl.textContent = err.message || "Could not load daily bonus status"; });
    }

    // Faucet
    var faucetRoot = document.querySelector("[data-faucet-root]");
    if (faucetRoot) {
      var faucetStatusEl = document.querySelector("[data-faucet-status]");
      var faucetClaimBtn = document.querySelector("[data-faucet-claim]");
      function renderFaucet(status) {
        if (!status.enabled) { faucetStatusEl.textContent = "The faucet is not currently available."; return; }
        if (status.canClaim) {
          faucetStatusEl.textContent = "Reward available: " + formatMinor(status.rewardMinor);
          faucetClaimBtn.hidden = false;
        } else {
          faucetStatusEl.textContent = "Next claim available soon — check back later.";
          faucetClaimBtn.hidden = true;
        }
      }
      faucetClaimBtn.addEventListener("click", function () {
        faucetClaimBtn.disabled = true;
        api("/faucet/claim", { method: "POST" }).then(function (result) {
          faucetStatusEl.textContent = "Claimed: " + formatMinor(result.rewardMinor);
          faucetClaimBtn.hidden = true;
          faucetClaimBtn.disabled = false;
          refreshNavAuthState();
        }).catch(function (err) {
          faucetClaimBtn.disabled = false;
          faucetStatusEl.textContent = err.message || "Could not claim faucet reward";
        });
      });
      api("/faucet/status").then(renderFaucet).catch(function (err) { faucetStatusEl.textContent = err.message || "Could not load faucet status"; });
    }

    // Spin & Win — one free spin/day. The backend picks the segment; this
    // code only animates the wheel to land where the server says it did.
    var spinRoot = document.querySelector("[data-spin-root]");
    if (spinRoot) {
      var spinStatusEl = document.querySelector("[data-spin-status]");
      var spinWheelWrap = document.querySelector("[data-spin-wheel-wrap]");
      var spinWheelEl = document.querySelector("[data-spin-wheel]");
      var spinBtn = document.querySelector("[data-spin-claim]");
      var spinColors = ["var(--brand)", "#000000", "var(--brand-bright)", "var(--elevated-hover)", "var(--brand-deep)", "#0a1128"];
      var spinSegments = [];
      var spinRotation = 0;

      function segmentAngles(segments) {
        var total = segments.reduce(function (sum, s) { return sum + s.weight; }, 0);
        var cumulative = 0;
        return segments.map(function (seg) {
          var start = (cumulative / total) * 360;
          cumulative += seg.weight;
          var end = (cumulative / total) * 360;
          return { start: start, end: end, mid: (start + end) / 2 };
        });
      }

      function renderWheel(segments) {
        spinSegments = segments;
        var angles = segmentAngles(segments);
        var gradientParts = angles.map(function (a, i) {
          return spinColors[i % spinColors.length] + " " + a.start + "deg " + a.end + "deg";
        });
        spinWheelEl.style.background = "conic-gradient(" + gradientParts.join(", ") + ")";
        spinWheelEl.innerHTML = "";
        segments.forEach(function (seg, i) {
          var label = document.createElement("span");
          label.className = "spin-wheel-label";
          label.textContent = seg.label;
          label.style.transform = "rotate(" + angles[i].mid + "deg)";
          spinWheelEl.appendChild(label);
        });
      }

      function renderStatus(status) {
        if (!status.enabled) { spinStatusEl.textContent = "Spin & Win is not currently available."; return; }
        renderWheel(status.segments);
        spinWheelWrap.hidden = false;
        if (status.canSpin) {
          spinStatusEl.textContent = "Tap below for your free daily spin.";
          spinBtn.hidden = false;
        } else {
          spinBtn.hidden = true;
          spinStatusEl.textContent = status.lastResult
            ? "Already spun today — you won " + status.lastResult.label + ". Come back tomorrow."
            : "Come back tomorrow for your next free spin.";
        }
      }

      spinBtn.addEventListener("click", function () {
        spinBtn.disabled = true;
        spinStatusEl.textContent = "Spinning…";
        api("/spin/claim", { method: "POST" }).then(function (result) {
          var angles = segmentAngles(spinSegments);
          var index = spinSegments.findIndex(function (s) { return s.label === result.label; });
          var mid = index >= 0 ? angles[index].mid : 0;
          var targetFinal = (360 - mid) % 360;
          var current = spinRotation % 360;
          var delta = (targetFinal - current + 360) % 360;
          spinRotation += 5 * 360 + delta;
          spinWheelEl.style.transform = "rotate(" + spinRotation + "deg)";
          window.setTimeout(function () {
            spinStatusEl.textContent = "You won " + result.label + "! (" + formatMinor(result.rewardMinor) + ")";
            spinBtn.hidden = true;
            spinBtn.disabled = false;
            refreshNavAuthState();
          }, 4200);
        }).catch(function (err) {
          spinBtn.disabled = false;
          spinStatusEl.textContent = err.message || "Could not spin right now";
        });
      });

      api("/spin/status").then(renderStatus).catch(function (err) { spinStatusEl.textContent = err.message || "Could not load spin status"; });
    }

    // Task lists (AdsLab PTC/Shortlink/Offer/Telegram/Review) — each
    // category is its own independent card; clicking its button loads that
    // category's list inline on this page (no popup, no nested feature).
    // Display/trigger only — reward crediting happens via AdsLab's
    // server-to-server postback straight to the backend
    // (/webhooks/adslab/tasks), independent of this page.
    var taskListRoots = document.querySelectorAll("[data-tasklist-root]");
    for (var lr = 0; lr < taskListRoots.length; lr++) {
      (function (root) {
        var category = root.getAttribute("data-category");
        var statusEl = root.querySelector("[data-tasklist-status]");
        var loadBtn = root.querySelector("[data-tasklist-load]");
        var listEl = root.querySelector("[data-tasklist-items]");
        statusEl.textContent = "Tap below to view available tasks.";
        loadBtn.hidden = false;
        loadBtn.addEventListener("click", function () {
          loadBtn.disabled = true;
          statusEl.textContent = "Loading…";
          api("/tasks/adslab/" + category).then(function (result) {
            var tasks = (result && result.tasks) || [];
            loadBtn.hidden = true;
            if (!tasks.length) {
              statusEl.textContent = "No tasks available right now — check back later.";
              return;
            }
            statusEl.textContent = "";
            listEl.innerHTML = "";
            tasks.forEach(function (task) {
              var item = document.createElement("a");
              item.className = "task-item";
              item.href = task.url;
              item.target = "_blank";
              item.rel = "noopener noreferrer nofollow";

              var img = document.createElement("img");
              img.className = "task-item-icon";
              img.src = task.image || "/assets/img/favicon-32x32.png";
              img.alt = "";
              img.loading = "lazy";

              var body = document.createElement("div");
              body.className = "task-item-body";
              var title = document.createElement("p");
              title.className = "task-item-title";
              title.textContent = task.title;
              var desc = document.createElement("p");
              desc.className = "task-item-desc";
              desc.textContent = task.description;
              body.appendChild(title);
              body.appendChild(desc);

              var reward = document.createElement("span");
              reward.className = "task-item-reward";
              reward.textContent = "$" + Number(task.rewardUsd || 0).toFixed(4);

              item.appendChild(img);
              item.appendChild(body);
              item.appendChild(reward);
              listEl.appendChild(item);
            });
            listEl.hidden = false;
          }).catch(function (err) {
            loadBtn.disabled = false;
            loadBtn.hidden = false;
            statusEl.textContent = err.message || "Could not load tasks";
          });
        });
      })(taskListRoots[lr]);
    }

    // Video Ads (AdsLab interstitial/rewarded) — display/trigger only.
    // Reward crediting happens via AdsLab's server-to-server postback
    // straight to the backend (/webhooks/adslab/interstitial,rewarded),
    // independent of this page — this code never credits a balance itself.
    var videoRoot = document.querySelector("[data-video-root]");
    if (videoRoot) {
      var videoStatusEl = document.querySelector("[data-video-status]");
      var videoWatchBtn = document.querySelector("[data-video-watch]");
      videoStatusEl.textContent = "Tap below to watch a video ad.";
      videoWatchBtn.hidden = false;
      videoWatchBtn.addEventListener("click", function () {
        if (!window.showrew_adslab) {
          videoStatusEl.textContent = "Video ads aren't available right now.";
          return;
        }
        videoWatchBtn.disabled = true;
        videoStatusEl.textContent = "Loading ad…";
        window.showrew_adslab().then(function () {
          videoStatusEl.textContent = "Ad watched — thanks for your support!";
          videoWatchBtn.disabled = false;
        }).catch(function () {
          videoStatusEl.textContent = "No ad available right now — try again shortly.";
          videoWatchBtn.disabled = false;
        });
      });
    }

    // Interstitial Ads (AdsLab) — standalone trigger. Display/trigger only;
    // reward crediting happens via AdsLab's server-to-server postback
    // straight to the backend, independent of this page.
    var interstitialRoot = document.querySelector("[data-interstitial-root]");
    if (interstitialRoot) {
      var interstitialStatusEl = document.querySelector("[data-interstitial-status]");
      var interstitialBtn = document.querySelector("[data-interstitial-show]");
      interstitialStatusEl.textContent = "Tap below to show an interstitial ad.";
      interstitialBtn.hidden = false;
      interstitialBtn.addEventListener("click", function () {
        if (!window.showint_adslab) {
          interstitialStatusEl.textContent = "Interstitial ads aren't available right now.";
          return;
        }
        interstitialBtn.disabled = true;
        interstitialStatusEl.textContent = "Loading ad…";
        window.showint_adslab().then(function () {
          interstitialStatusEl.textContent = "Ad closed — thanks for your support!";
          interstitialBtn.disabled = false;
        }).catch(function () {
          interstitialStatusEl.textContent = "No ad available right now — try again shortly.";
          interstitialBtn.disabled = false;
        });
      });
    }
  }

  // ---------------------------------------------------------------------
  // Withdraw page
  // ---------------------------------------------------------------------
  function initWithdrawPage() {
    var kycBlock = document.querySelector("[data-withdraw-kyc-block]");
    if (!kycBlock) return;
    if (!isLoggedIn()) return;

    api("/wallet/summary").then(function (summary) {
      document.querySelector("[data-withdraw-balance]").textContent = formatMinor(summary.availableBalanceMinor, summary.currency);
      document.querySelector("[data-withdraw-pending]").textContent = formatMinor(summary.pendingBalanceMinor, summary.currency);
      document.querySelector("[data-withdraw-lifetime]").textContent = formatMinor(summary.lifetimeEarnedMinor, summary.currency);
    }).catch(function () {});

    // This backend doesn't have a real identity-verification (KYC) step
    // wired up yet, so the withdrawal form is shown directly rather than
    // gating it behind a check that could never pass.
    document.querySelector("[data-withdraw-form-block]").hidden = false;

    var withdrawForm = document.querySelector("[data-withdraw-form]");
    if (withdrawForm) {
      withdrawForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(withdrawForm);
        api("/withdrawals", {
          method: "POST",
          body: {
            amountMinor: parseInt(fd.get("amountMinor"), 10),
            method: fd.get("method"),
            destination: { accountTitle: fd.get("accountTitle"), accountNumber: fd.get("accountNumber") },
          },
        }).then(function () {
          document.querySelector("[data-withdraw-success]").hidden = false;
          document.querySelector("[data-withdraw-error]").hidden = true;
          withdrawForm.reset();
          loadHistory();
        }).catch(function (err) {
          var errEl = document.querySelector("[data-withdraw-error]");
          errEl.textContent = err.message || "Could not request withdrawal";
          errEl.hidden = false;
        });
      });
    }

    function loadHistory() {
      var statusEl = document.querySelector("[data-withdraw-history-status]");
      var listEl = document.querySelector("[data-withdraw-history-list]");
      api("/withdrawals").then(function (result) {
        listEl.innerHTML = "";
        if (!result.withdrawals.length) { statusEl.textContent = "No withdrawals yet."; return; }
        statusEl.textContent = "";
        result.withdrawals.forEach(function (w) {
          var row = document.createElement("div");
          row.className = "earn-list-row";
          row.innerHTML = "<span>" + formatMinor(w.amountMinor, w.currency) + " via " + w.method + "</span><span class=\"badge-status\">" + w.status + "</span>";
          listEl.appendChild(row);
        });
      }).catch(function (err) { statusEl.textContent = err.message || "Could not load withdrawal history"; });
    }
    loadHistory();
  }

  // ---------------------------------------------------------------------
  // Referral page
  // ---------------------------------------------------------------------
  function initReferralPage() {
    var linkInput = document.querySelector("[data-referral-link]");
    if (!linkInput) return;
    if (!isLoggedIn()) return;

    api("/referrals/stats").then(function (stats) {
      document.querySelector("[data-referral-total]").textContent = stats.totalReferrals;
      document.querySelector("[data-referral-active]").textContent = stats.activeReferrals;
      document.querySelector("[data-referral-earnings]").textContent = formatMinor(stats.referralEarningsMinor);
      var session = getSession();
      var friendlyLink = window.location.origin + "/signup.html?ref=" + encodeURIComponent(session.user.referralCode);
      linkInput.value = friendlyLink;
    }).catch(function () {});

    var copyBtn = document.querySelector("[data-referral-copy]");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        linkInput.select();
        navigator.clipboard && navigator.clipboard.writeText(linkInput.value).then(function () {
          copyBtn.textContent = "Copied!";
          window.setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
        });
      });
    }
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    refreshNavAuthState();
    initGoogleSignIn();
    initAuthForms();
    initEarnPage();
    initWithdrawPage();
    initReferralPage();
  });
})();
