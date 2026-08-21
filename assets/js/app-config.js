// Real config for the Baloch Sahab earning platform frontend.
// apiBaseUrl points at the real, live EarnBox backend (Render) — the same
// backend the EarnBox mobile app and admin panel use. No separate backend
// exists for this website; every earning/withdraw/referral feature below
// reuses the real EarnBox REST API.
//
// googleClientId is intentionally empty until a real Google OAuth "Web
// application" Client ID is configured (Google Cloud Console) AND the same
// value is set as GOOGLE_OAUTH_CLIENT_ID on the backend (Render) — both
// sides must match, since the backend verifies the ID token's audience
// against that exact value. Until then, the Google Sign-In buttons on the
// login/signup pages stay hidden rather than pretending to work.
window.APP_CONFIG = {
  apiBaseUrl: "https://earnbox-idco-ruji.onrender.com/api/v1",
  googleClientId: "",
};
