$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
# Cache-busting query string appended to every static asset URL below —
# changes on every build, so Cloudflare/browsers always fetch the new file
# instead of serving a stale cached copy after a deploy (a real, repeated
# problem: /assets/* is cached for up to a month per docs/CLOUDFLARE.md,
# and Cloudflare doesn't know to purge it just because GitHub Pages
# rebuilt — a differently-named URL sidesteps that entirely).
$buildVersion = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$criticalCss = ""
$critPath = Join-Path $root "assets\css\critical.min.css"
if (Test-Path $critPath) {
  $criticalCss = [IO.File]::ReadAllText($critPath).Trim()
} else {
  $critPath2 = Join-Path $root "assets\css\critical.css"
  if (Test-Path $critPath2) { $criticalCss = [IO.File]::ReadAllText($critPath2).Trim() }
}

function Head($title,$desc,$canon,[string]$extra="") {
$og = "https://balochsahab.com$canon"
$csp = "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' https://accounts.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.profitableratecpmnetwork.com https://*.highrevenueformat.com; frame-src https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.profitableratecpmnetwork.com https://*.highrevenueformat.com; connect-src 'self' https:; form-action 'self' mailto: https:; upgrade-insecure-requests"
@"
<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){var h=location.hostname;if(h==="www.balochsahab.com"||location.protocol==="http:"){location.replace("https://balochsahab.com"+location.pathname+location.search+location.hash);}})();</script><!-- apex-https-redirect -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$title</title>
<meta name="description" content="$desc">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="Baloch Sahab">
<meta name="theme-color" content="#0a0c10">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="$og">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="Baloch Sahab">
<meta property="og:title" content="$title">
<meta property="og:description" content="$desc">
<meta property="og:url" content="$og">
<meta property="og:image" content="https://balochsahab.com/assets/img/og-cover.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$title">
<meta name="twitter:description" content="$desc">
<meta name="twitter:image" content="https://balochsahab.com/assets/img/og-cover.png">
<meta http-equiv="Content-Security-Policy" content="$csp">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon.ico" sizes="any">
<link rel="icon" href="/assets/img/favicon-16x16.png" sizes="16x16" type="image/png">
<link rel="icon" href="/assets/img/favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="mask-icon" href="/assets/img/mask-icon.svg" color="#eab308">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" as="image" href="/assets/img/logo-256.webp" type="image/webp" fetchpriority="high">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@600;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@600;700&display=swap" rel="stylesheet"></noscript>
<style>$criticalCss</style>
<link rel="stylesheet" href="/assets/css/main.min.css?v=$buildVersion" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/assets/css/main.min.css?v=$buildVersion"></noscript>
<script src="/assets/js/app-config.js?v=$buildVersion"></script>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6831828383879093" crossorigin="anonymous"></script>
<script>(adsbygoogle = window.adsbygoogle || []).push({google_ad_client: "ca-pub-6831828383879093", enable_page_level_ads: true});</script>
$extra
</head>
<body class="no-js">
<script>document.body.classList.remove('no-js');</script>
<a class="skip-link" href="#main">Skip to content</a>
<span id="top"></span>
<header class="site-header">
<div class="container nav" data-nav>
<a class="brand" href="/index.html">
<picture>
<source type="image/webp" srcset="/assets/img/logo-128.webp 128w, /assets/img/logo-256.webp 256w" sizes="44px">
<img src="/assets/img/logo-256.png" srcset="/assets/img/logo-128.png 128w, /assets/img/logo-256.png 256w" sizes="44px" width="44" height="44" alt="Baloch Sahab" decoding="async" fetchpriority="high">
</picture>
<span class="brand-text">Baloch Sahab</span>
</a>
<ul class="nav-links" aria-label="Primary">
<li><a href="/index.html">Home</a></li>
<li><a href="/earn.html">Earn</a></li>
<li><a href="/withdraw.html">Withdraw</a></li>
<li><a href="/referral.html">Referral</a></li>
<li><a href="/faq.html">FAQ</a></li>
<li><a href="/about.html">About Us</a></li>
<li><a href="/contact.html">Contact Us</a></li>
</ul>
<div class="nav-actions">
<span class="auth-slot auth-guest" data-auth="guest">
<a class="btn btn-secondary nav-cta" href="/login.html">Log In</a>
<a class="btn btn-primary nav-cta" href="/signup.html">Sign Up</a>
</span>
<span class="auth-slot auth-user" data-auth="user" hidden>
<a class="balance-pill" href="/withdraw.html"><span data-balance-pill>`$0.0000</span></a>
<button class="btn btn-secondary nav-cta" type="button" data-logout>Log Out</button>
</span>
<button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-label="Open menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
</div>
</div>
<div class="mobile-panel" data-mobile-nav>
<a href="/index.html">Home</a><a href="/earn.html">Earn</a><a href="/withdraw.html">Withdraw</a><a href="/referral.html">Referral</a><a href="/faq.html">FAQ</a><a href="/about.html">About Us</a><a href="/contact.html">Contact Us</a>
<span class="auth-slot auth-guest" data-auth="guest"><a href="/login.html">Log In</a><a href="/signup.html">Sign Up</a></span>
<span class="auth-slot auth-user" data-auth="user" hidden><a href="/withdraw.html">Balance: <span data-balance-pill>`$0.0000</span></a><a href="#" data-logout>Log Out</a></span>
</div>
</header>
<main id="main">
"@
}

function Foot {
@"
</main>
<a class="wa-float" href="https://wa.me/923218818909" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.7L2 22l4.4-1.2A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.6.7.7-2.5-.2-.3A9 9 0 1 1 12 20.5zm5.2-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.2-.7.9-.8 1-.3.2-.6.1a7.3 7.3 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.5-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.5 4 14 14 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.9 2.9 0 0 0 1.9-1.3 2.4 2.4 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>
</a>
<footer class="site-footer" aria-label="Site footer">
<div class="container">
<div class="footer-grid">
<div class="footer-brand">
<a class="brand" href="/index.html">
<picture>
<source type="image/webp" srcset="/assets/img/logo-256.webp">
<img src="/assets/img/logo-256.png" width="52" height="52" alt="Baloch Sahab" loading="lazy" decoding="async">
</picture>
<span class="brand-text">Baloch Sahab</span>
</a>
<p>Earn rewards by completing available activities.</p>
<div class="socials" aria-label="Social links">
<a href="https://wa.me/923218818909" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">WA</a>
<a href="mailto:hello@balochsahab.com" aria-label="Email hello@balochsahab.com">EM</a>
</div>
</div>
<div class="footer-col"><h4>Company</h4><ul><li><a href="/about.html">About Us</a></li><li><a href="/contact.html">Contact</a></li></ul></div>
<div class="footer-col"><h4>Earn</h4><ul><li><a href="/earn.html#ptc">PTC Ads</a></li><li><a href="/earn.html#shortlinks">Shortlinks</a></li><li><a href="/earn.html#offerwall">Offerwall</a></li><li><a href="/earn.html#video-ads">Video Ads</a></li></ul></div>
<div class="footer-col"><h4>Support</h4><ul><li><a href="/faq.html">FAQ</a></li><li><a href="/contact.html">Help</a></li><li><a href="/withdraw.html">Withdraw</a></li></ul></div>
<div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy-policy.html">Privacy Policy</a></li><li><a href="/terms-of-service.html">Terms of Service</a></li><li><a href="/cookie-policy.html">Cookie Policy</a></li></ul></div>
</div>
<div class="footer-bottom">
<p>&copy; <span data-year>2026</span> Baloch Sahab. All Rights Reserved.</p>
<nav aria-label="Legal"><a href="/privacy-policy.html">Privacy</a><a href="/terms-of-service.html">Terms</a><a href="mailto:support@balochsahab.com">Support</a><a class="back-to-top" href="#top">&uarr; Back to top</a></nav>
</div>
</div>
</footer>
<script src="/assets/js/main.min.js?v=$buildVersion" defer></script>
<script src="/assets/js/earn-app.js?v=$buildVersion" defer></script>
<script src="https://pl30954370.profitableratecpmnetwork.com/2e/05/1e/2e051e66dc3a07ce784ca1255ee7069f.js"></script>
<script src="https://pl30954373.profitableratecpmnetwork.com/6a/65/06/6a650601f495d4f149449001a675f762.js"></script>
</body>
</html>
"@
}

function Write-SitePage {
  param([string]$Rel,[string]$Title,[string]$Desc,[string]$Canon,[string]$Body,[string]$Extra="")
  $full = Join-Path $root $Rel
  $dir = Split-Path $full -Parent
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [IO.File]::WriteAllText($full, ((Head $Title $Desc $Canon $Extra) + $Body + (Foot)), [Text.UTF8Encoding]::new($false))
  Write-Output "OK $Rel"
}
