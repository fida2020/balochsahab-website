$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
. ".\scripts\chrome.ps1"
$bodies = Join-Path $root "scripts\bodies"

function Build-FromBody($rel, $title, $desc, $canon, $bodyFile, $extra = "") {
  $path = Join-Path $bodies $bodyFile
  if (!(Test-Path $path)) { throw "Missing body: $bodyFile" }
  $body = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  Write-SitePage $rel $title $desc $canon $body $extra
}

$schema = [IO.File]::ReadAllText((Join-Path $bodies "schema.html"), [Text.Encoding]::UTF8)

Build-FromBody "index.html" "Baloch Sahab | Earn Rewards Online" "Baloch Sahab is an online earning and rewards platform. Complete real tasks, ads, and offers and withdraw your verified earnings." "/index.html" "home.html" $schema
Build-FromBody "earn.html" "Earn | Baloch Sahab" "Earn rewards with PTC ads, shortlinks, offerwall tasks, games, video ads, a daily check-in, and the faucet." "/earn.html" "earn.html"
Build-FromBody "daily-claim.html" "Daily Claim | Baloch Sahab" "Claim your Baloch Sahab daily streak bonus." "/daily-claim.html" "daily-claim.html"
Build-FromBody "faucet.html" "Rolling Faucet | Baloch Sahab" "Claim free recurring faucet rewards on Baloch Sahab." "/faucet.html" "faucet.html"
Build-FromBody "spin-win.html" "Spin & Win | Baloch Sahab" "Spin the daily fortune wheel on Baloch Sahab." "/spin-win.html" "spin-win.html"
Build-FromBody "offerwall.html" "Offer Wall | Baloch Sahab" "Complete high-paying offers and partner campaigns on Baloch Sahab." "/offerwall.html" "offerwall.html"
Build-FromBody "shortlinks.html" "Short Links | Baloch Sahab" "Complete shortlink tasks for quick rewards on Baloch Sahab." "/shortlinks.html" "shortlinks.html"
Build-FromBody "telegram-views.html" "Telegram Views | Baloch Sahab" "Join partner Telegram channels and groups for rewards on Baloch Sahab." "/telegram-views.html" "telegram-views.html"
Build-FromBody "ptc.html" "PTC | Baloch Sahab" "View sponsored websites for a fixed timer and earn verified rewards on Baloch Sahab." "/ptc.html" "ptc.html"
Build-FromBody "watch-ads.html" "Watch Ads | Baloch Sahab" "Watch sponsored ad placements for rewards on Baloch Sahab." "/watch-ads.html" "watch-ads.html"
Build-FromBody "video-ads.html" "Video Ads | Baloch Sahab" "Watch short video ads to completion for rewards on Baloch Sahab." "/video-ads.html" "video-ads.html"
Build-FromBody "interstitial-ads.html" "Interstitial Ads | Baloch Sahab" "View full-screen interstitial ads for rewards on Baloch Sahab." "/interstitial-ads.html" "interstitial-ads.html"
Build-FromBody "vip.html" "VIP | Baloch Sahab" "Unlock higher rewards and exclusive perks on Baloch Sahab." "/vip.html" "vip.html"
Build-FromBody "reviews.html" "Reviews | Baloch Sahab" "Write verified reviews for partner products and services on Baloch Sahab." "/reviews.html" "reviews.html"
Build-FromBody "profile.html" "Profile | Baloch Sahab" "Manage your Baloch Sahab account profile." "/profile.html" "profile.html"
Build-FromBody "settings.html" "Settings | Baloch Sahab" "Manage your Baloch Sahab account settings." "/settings.html" "settings.html"
Build-FromBody "withdraw.html" "Withdraw | Baloch Sahab" "Withdraw your verified Baloch Sahab earnings to a supported payment method." "/withdraw.html" "withdraw.html"
Build-FromBody "referral.html" "Referral | Baloch Sahab" "Share your Baloch Sahab referral link and earn a bonus for every active friend you refer." "/referral.html" "referral.html"
$faqExtra = ""
$faqSchemaPath = Join-Path $bodies "faq-schema.html"
if (Test-Path $faqSchemaPath) { $faqExtra = [IO.File]::ReadAllText($faqSchemaPath, [Text.Encoding]::UTF8) }
Build-FromBody "faq.html" "FAQ | Baloch Sahab" "Frequently asked questions about earning, withdrawing, and referrals on Baloch Sahab." "/faq.html" "faq.html" $faqExtra
Build-FromBody "about.html" "About Us | Baloch Sahab" "Learn about Baloch Sahab, an online earning and rewards platform operated by Baloch Sahab Technologies." "/about.html" "about.html"
Build-FromBody "contact.html" "Contact Us | Baloch Sahab" "Contact Baloch Sahab via WhatsApp, email, or the contact form." "/contact.html" "contact.html"
Build-FromBody "signup.html" "Sign Up | Baloch Sahab" "Create your free Baloch Sahab account and start earning." "/signup.html" "signup.html"
Build-FromBody "login.html" "Log In | Baloch Sahab" "Log in to your Baloch Sahab account." "/login.html" "login.html"
Build-FromBody "forgot-password.html" "Forgot Password | Baloch Sahab" "Reset your Baloch Sahab account password." "/forgot-password.html" "forgot-password.html"
Build-FromBody "reset-password.html" "Reset Password | Baloch Sahab" "Set a new password for your Baloch Sahab account." "/reset-password.html" "reset-password.html"
Build-FromBody "verify-email.html" "Verify Email | Baloch Sahab" "Verify your email address to activate your Baloch Sahab account." "/verify-email.html" "verify-email.html"
Build-FromBody "privacy-policy.html" "Privacy Policy | Baloch Sahab" "Privacy Policy for Baloch Sahab - how we collect, use, and protect personal information." "/privacy-policy.html" "privacy.html"
Build-FromBody "terms-of-service.html" "Terms of Service | Baloch Sahab" "Terms of Service for the Baloch Sahab earning and rewards platform." "/terms-of-service.html" "terms.html"
Build-FromBody "cookie-policy.html" "Cookie Policy | Baloch Sahab" "Cookie Policy for Baloch Sahab explaining how cookies and similar technologies are used." "/cookie-policy.html" "cookie.html"
Build-FromBody "refund-policy.html" "Refund Policy | Baloch Sahab" "How Baloch Sahab handles reward reversals and withdrawal issues." "/refund-policy.html" "refund-policy.html"
Build-FromBody "security-policy.html" "Security Policy | Baloch Sahab" "Security Policy for Baloch Sahab - HTTPS, access controls, and data protection practices." "/security-policy.html" "security-policy.html"
Build-FromBody "responsible-disclosure.html" "Responsible Disclosure | Baloch Sahab" "Responsible disclosure policy for reporting security issues to Baloch Sahab." "/responsible-disclosure.html" "responsible-disclosure.html"
Build-FromBody "404.html" "Page Not Found | Baloch Sahab" "The page you requested could not be found on Baloch Sahab." "/404.html" "404.html"

$urls = @(
  "/", "/index.html", "/earn.html", "/withdraw.html", "/referral.html", "/faq.html", "/about.html", "/contact.html",
  "/signup.html", "/login.html",
  "/daily-claim.html", "/faucet.html", "/spin-win.html", "/offerwall.html", "/shortlinks.html",
  "/telegram-views.html", "/ptc.html", "/watch-ads.html", "/video-ads.html", "/interstitial-ads.html",
  "/vip.html", "/reviews.html",
  "/privacy-policy.html", "/terms-of-service.html", "/cookie-policy.html", "/refund-policy.html",
  "/security-policy.html", "/responsible-disclosure.html"
)
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($u in $urls) {
  $prio = if ($u -eq "/" -or $u -eq "/index.html") { "1.0" } elseif ($u -match "privacy|terms|cookie|refund|security|responsible") { "0.5" } else { "0.8" }
  [void]$sb.AppendLine("  <url><loc>https://balochsahab.com$u</loc><changefreq>weekly</changefreq><priority>$prio</priority></url>")
}
[void]$sb.AppendLine('</urlset>')
[IO.File]::WriteAllText((Join-Path $root "sitemap.xml"), $sb.ToString(), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $root "robots.txt"), "User-agent: *`nAllow: /`n`nSitemap: https://balochsahab.com/sitemap.xml`n", [Text.UTF8Encoding]::new($false))
Write-Output "BUILD COMPLETE"
