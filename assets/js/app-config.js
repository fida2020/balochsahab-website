// Real config for the Baloch Sahab earning platform frontend.
// apiBaseUrl points at the real, live EarnBox backend (Render) — the same
// backend the EarnBox mobile app and admin panel use. No separate backend
// exists for this website; every earning/withdraw/referral feature below
// reuses the real EarnBox REST API.
//
// googleClientId is a real Google OAuth 2.0 "Web application" Client ID
// (created 2026-08-22, Authorized JavaScript origin: https://balochsahab.com).
// Client IDs are not secret (Google's own convention — safe in client code).
// The SAME value must also be set as GOOGLE_OAUTH_CLIENT_ID on the backend
// (Render), since the backend verifies the ID token's audience against
// that exact value — if the two ever drift apart, Google Sign-In will
// fail with an audience-mismatch error even though the button renders.
window.APP_CONFIG = {
  apiBaseUrl: "https://earnbox-idco-ruji.onrender.com/api/v1",
  googleClientId: "716739512260-tb2rm1m6fkvr84b45trtjk3b22nneesa.apps.googleusercontent.com",
};
