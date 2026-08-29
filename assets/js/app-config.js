// Real config for the Baloch Sahab earning platform frontend.
// apiBaseUrl points at the website's OWN separate backend/database
// (baloch-sahab-backend on Render) — by explicit decision, this is NOT the
// EarnBox backend. Website users/wallet are a completely separate system
// from the EarnBox mobile app's users/wallet.
//
// googleClientId is a real Google OAuth 2.0 "Web application" Client ID
// (created 2026-08-22, Authorized JavaScript origin: https://balochsahab.com).
// NOTE: this site is moving to https://earn.balochsahab.com (apex domain will
// host the separate Baloch Sahab Technologies company site instead) — add
// https://earn.balochsahab.com as an additional Authorized JavaScript origin
// on this OAuth Client in Google Cloud Console before/when the DNS switches,
// or Sign-In-with-Google will fail on the new domain.
// Client IDs are not secret (Google's own convention — safe in client code).
// The SAME value must also be set as GOOGLE_OAUTH_CLIENT_ID on the
// website's OWN backend (Render service baloch-sahab-backend), since the
// backend verifies the ID token's audience against that exact value.
window.APP_CONFIG = {
  apiBaseUrl: "https://baloch-sahab-backend.onrender.com/api/v1",
  googleClientId: "716739512260-tb2rm1m6fkvr84b45trtjk3b22nneesa.apps.googleusercontent.com",
};
