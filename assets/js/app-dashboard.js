(function () {
  "use strict";

  var uploadedMedia = null; // { key, url }

  function $(id) {
    return document.getElementById(id);
  }

  function showMsg(el, text) {
    el.textContent = text;
    el.classList.add("visible");
  }

  function hideMsg(el) {
    el.classList.remove("visible");
    el.textContent = "";
  }

  function statusBadge(status) {
    var span = document.createElement("span");
    span.className = "badge badge-" + status;
    span.textContent = status;
    return span;
  }

  // -- session / identity ---------------------------------------------------

  function loadSession() {
    return fetch("/auth/session", { credentials: "include" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data.connected) {
          window.location.href = "/app/login.html";
          return Promise.reject(new Error("not_connected"));
        }
        $("identity-name").textContent = data.displayName || "Connected account";
        if (data.avatarUrl) $("identity-avatar").src = data.avatarUrl;
        return data;
      });
  }

  $("disconnect-btn").addEventListener("click", function () {
    fetch("/auth/logout", { method: "POST", credentials: "include" }).finally(function () {
      window.location.href = "/app/login.html";
    });
  });

  // -- creator info (real allowed privacy options) --------------------------

  var PRIVACY_LABELS = {
    PUBLIC_TO_EVERYONE: "Everyone",
    MUTUAL_FOLLOW_FRIENDS: "Friends (mutual follows)",
    FOLLOWER_OF_CREATOR: "Followers",
    SELF_ONLY: "Only me",
  };

  function loadCreatorInfo() {
    var select = $("privacy-level");
    return fetch("/api/tiktok/creator-info", { credentials: "include" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        select.innerHTML = "";
        var options = data.privacy_level_options || ["SELF_ONLY"];
        options.forEach(function (value) {
          var opt = document.createElement("option");
          opt.value = value;
          opt.textContent = PRIVACY_LABELS[value] || value;
          select.appendChild(opt);
        });
      })
      .catch(function () {
        select.innerHTML = '<option value="SELF_ONLY">Only me</option>';
      });
  }

  // -- branded content constrains privacy options (mirrors TikTok's rule) ---

  $("is-branded").addEventListener("change", function () {
    var select = $("privacy-level");
    var selfOnly = select.querySelector('option[value="SELF_ONLY"]');
    if (this.checked) {
      if (selfOnly) selfOnly.disabled = true;
      if (select.value === "SELF_ONLY" && select.options.length > 1) {
        select.selectedIndex = 0;
      }
    } else if (selfOnly) {
      selfOnly.disabled = false;
    }
  });

  // -- schedule toggle --------------------------------------------------------

  document.querySelectorAll('input[name="when"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      $("scheduled-at").disabled = document.querySelector('input[name="when"]:checked').value !== "later";
    });
  });

  // -- AI suggest ---------------------------------------------------------------

  $("ai-suggest-btn").addEventListener("click", function () {
    var btn = this;
    var topic = $("ai-topic").value.trim();
    if (!topic) return;
    btn.disabled = true;
    btn.textContent = "Thinking…";
    fetch("/api/ai/suggest", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topic }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.caption) $("caption").value = data.caption;
        if (data.hashtags && data.hashtags.length) $("hashtags").value = data.hashtags.join(", ");
      })
      .catch(function () {
        showMsg($("form-error"), "AI suggestion failed. You can still write your own caption.");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "AI-suggest";
      });
  });

  // -- upload video -------------------------------------------------------------

  function uploadVideo(file) {
    var status = $("upload-status");
    status.textContent = "Uploading…";
    var form = new FormData();
    form.append("video", file);
    return fetch("/api/media/upload", { method: "POST", credentials: "include", body: form })
      .then(function (res) {
        if (!res.ok) throw new Error("upload_failed");
        return res.json();
      })
      .then(function (data) {
        uploadedMedia = { key: data.key, url: data.url };
        status.textContent = "Uploaded.";
        return uploadedMedia;
      })
      .catch(function (err) {
        status.textContent = "Upload failed. Please try again.";
        throw err;
      });
  }

  $("video-file").addEventListener("change", function () {
    uploadedMedia = null;
    if (this.files && this.files[0]) uploadVideo(this.files[0]);
  });

  // -- posts list -----------------------------------------------------------------

  function formatScheduledAt(unixSeconds) {
    if (!unixSeconds) return "—";
    return new Date(unixSeconds * 1000).toLocaleString();
  }

  function loadPosts() {
    return fetch("/api/posts", { credentials: "include" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var posts = data.posts || [];
        var table = $("posts-table");
        var empty = $("posts-empty");
        var tbody = $("posts-tbody");
        tbody.innerHTML = "";

        if (posts.length === 0) {
          table.style.display = "none";
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        table.style.display = "table";

        posts.forEach(function (post) {
          var tr = document.createElement("tr");

          var statusTd = document.createElement("td");
          statusTd.appendChild(statusBadge(post.status));
          tr.appendChild(statusTd);

          var captionTd = document.createElement("td");
          captionTd.textContent = post.caption.length > 60 ? post.caption.slice(0, 60) + "…" : post.caption;
          tr.appendChild(captionTd);

          var scheduledTd = document.createElement("td");
          scheduledTd.textContent = formatScheduledAt(post.scheduled_at);
          tr.appendChild(scheduledTd);

          var actionTd = document.createElement("td");
          if (post.status === "draft" || post.status === "scheduled") {
            var delBtn = document.createElement("button");
            delBtn.className = "btn btn-secondary";
            delBtn.type = "button";
            delBtn.textContent = "Delete";
            delBtn.addEventListener("click", function () {
              fetch("/api/posts/" + post.id, { method: "DELETE", credentials: "include" }).then(loadPosts);
            });
            actionTd.appendChild(delBtn);
          }
          tr.appendChild(actionTd);

          tbody.appendChild(tr);
        });
      });
  }

  // -- create post form -----------------------------------------------------------

  $("post-form").addEventListener("submit", function (e) {
    e.preventDefault();
    hideMsg($("form-error"));
    hideMsg($("form-success"));

    var submitBtn = $("submit-btn");
    var whenLater = document.querySelector('input[name="when"]:checked').value === "later";
    var scheduledInput = $("scheduled-at");

    if (!$("is-aigc").checked) {
      showMsg($("form-error"), "Please confirm the AI-generated content disclosure before posting.");
      return;
    }
    if (whenLater && !scheduledInput.value) {
      showMsg($("form-error"), "Please choose a date/time to schedule this post.");
      return;
    }

    var fileInput = $("video-file");
    var uploadPromise = uploadedMedia
      ? Promise.resolve(uploadedMedia)
      : fileInput.files && fileInput.files[0]
      ? uploadVideo(fileInput.files[0])
      : Promise.reject(new Error("no_video"));

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating…";

    uploadPromise
      .then(function (media) {
        var hashtags = $("hashtags")
          .value.split(",")
          .map(function (h) {
            return h.trim();
          })
          .filter(Boolean);

        var scheduledAt = whenLater ? Math.floor(new Date(scheduledInput.value).getTime() / 1000) : null;

        return fetch("/api/posts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caption: $("caption").value,
            hashtags: hashtags,
            mediaKey: media.key,
            videoUrl: media.url,
            privacyLevel: $("privacy-level").value,
            disableDuet: $("disable-duet").checked,
            disableComment: $("disable-comment").checked,
            disableStitch: $("disable-stitch").checked,
            isAigc: true,
            isBrandedContent: $("is-branded").checked,
            publishTarget: "inbox",
            scheduledAt: scheduledAt,
          }),
        });
      })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (body) {
          throw new Error(body.error || "create_failed");
        });
        return res.json();
      })
      .then(function (data) {
        if (whenLater) {
          showMsg($("form-success"), "Post scheduled.");
          return Promise.resolve();
        }
        return fetch("/api/posts/" + data.post.id + "/publish", { method: "POST", credentials: "include" }).then(
          function (res) {
            if (!res.ok) throw new Error("publish_failed");
            showMsg($("form-success"), "Post submitted to TikTok.");
          }
        );
      })
      .then(function () {
        $("post-form").reset();
        uploadedMedia = null;
        $("upload-status").textContent = "";
        return loadPosts();
      })
      .catch(function (err) {
        showMsg($("form-error"), "Something went wrong: " + (err.message || "please try again"));
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create post";
      });
  });

  // -- init -----------------------------------------------------------------------

  loadSession()
    .then(function () {
      return Promise.all([loadCreatorInfo(), loadPosts()]);
    })
    .catch(function () {
      /* loadSession already redirects to /app/login.html on failure */
    });
})();
