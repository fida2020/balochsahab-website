$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Administrator\tiktok-verification"
. ".\scripts\chrome.ps1"
$bodies = "C:\Users\Administrator\tiktok-verification\scripts\bodies"

function Build-FromBody($rel, $title, $desc, $canon, $bodyFile, $extra = "") {
  $body = [IO.File]::ReadAllText((Join-Path $bodies $bodyFile), [Text.Encoding]::UTF8)
  Write-SitePage $rel $title $desc $canon $body $extra
}

$schema = [IO.File]::ReadAllText((Join-Path $bodies "schema.html"), [Text.Encoding]::UTF8)

Build-FromBody "index.html" "Baloch Sahab Automation | AI Social Media Automation SaaS" "Premium AI-powered social media automation for TikTok and major platforms. Public SaaS with Starter, Professional, Business, and Enterprise plans." "/index.html" "home.html" $schema
Build-FromBody "features.html" "Features | Baloch Sahab Automation" "Explore AI content, smart scheduling, multi-platform sync, analytics, and secure workspaces from Baloch Sahab Automation." "/features.html" "features.html"
Build-FromBody "solutions.html" "Solutions | Baloch Sahab Automation" "Solutions for creators, agencies, and brands automating TikTok and social publishing with Baloch Sahab Automation." "/solutions.html" "solutions.html"
Build-FromBody "pricing.html" "Pricing | Baloch Sahab Automation" "Starter `$9, Professional `$19, Business `$49 per month, plus Enterprise Contact Sales for AI social media automation." "/pricing.html" "pricing.html"
Build-FromBody "about.html" "About | Baloch Sahab Automation" "Learn about Baloch Sahab Automation - a public AI SaaS company building premium social media automation." "/about.html" "about.html"
Build-FromBody "faq.html" "FAQ | Baloch Sahab Automation" "Frequently asked questions about Baloch Sahab Automation pricing, platforms, privacy, and support." "/faq.html" "faq.html"
Build-FromBody "contact.html" "Contact | Baloch Sahab Automation" "Contact Baloch Sahab Automation via WhatsApp, email support@balochsahab.com, or the website contact form." "/contact.html" "contact.html"
Build-FromBody "privacy-policy.html" "Privacy Policy | Baloch Sahab Automation" "Privacy Policy for Baloch Sahab Automation - how we collect, use, and protect personal information." "/privacy-policy.html" "privacy.html"
Build-FromBody "terms-of-service.html" "Terms of Service | Baloch Sahab Automation" "Terms of Service for Baloch Sahab Automation public SaaS website and product." "/terms-of-service.html" "terms.html"
Build-FromBody "cookie-policy.html" "Cookie Policy | Baloch Sahab Automation" "Cookie Policy for Baloch Sahab Automation explaining how cookies and similar technologies are used." "/cookie-policy.html" "cookie.html"
Build-FromBody "404.html" "Page Not Found | Baloch Sahab Automation" "The page you requested could not be found on Baloch Sahab Automation." "/404.html" "404.html"
Build-FromBody "services.html" "Services | Baloch Sahab Automation" "Baloch Sahab Automation services - explore features and solutions." "/services.html" "services.html"
Build-FromBody "app/index.html" "App | Baloch Sahab Automation" "Access Baloch Sahab Automation - contact us to get started." "/app/index.html" "app.html"
Build-FromBody "blog/index.html" "Blog | Baloch Sahab Automation" "Insights on AI social media automation from Baloch Sahab Automation." "/blog/index.html" "blog-index.html"
Build-FromBody "blog/ai-content-automation.html" "AI Content Automation | Baloch Sahab Automation" "How AI content automation helps creators publish consistently across platforms." "/blog/ai-content-automation.html" "blog-post.html"
Build-FromBody "docs/index.html" "Docs | Baloch Sahab Automation" "Documentation for Baloch Sahab Automation." "/docs/index.html" "docs-index.html"
Build-FromBody "docs/getting-started.html" "Getting Started | Baloch Sahab Automation" "Getting started guide for Baloch Sahab Automation." "/docs/getting-started.html" "docs-start.html"
Build-FromBody "docs/architecture.html" "Architecture | Baloch Sahab Automation" "Architecture overview for Baloch Sahab Automation." "/docs/architecture.html" "docs-arch.html"

$sitemap = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://balochsahab.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://balochsahab.com/index.html</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://balochsahab.com/features.html</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://balochsahab.com/solutions.html</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://balochsahab.com/pricing.html</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://balochsahab.com/about.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://balochsahab.com/faq.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://balochsahab.com/contact.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://balochsahab.com/privacy-policy.html</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>
  <url><loc>https://balochsahab.com/terms-of-service.html</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>
  <url><loc>https://balochsahab.com/cookie-policy.html</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>
</urlset>
"@
[IO.File]::WriteAllText((Join-Path $root "sitemap.xml"), $sitemap.Trim() + "`n", [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $root "robots.txt"), "User-agent: *`nAllow: /`n`nSitemap: https://balochsahab.com/sitemap.xml`n", [Text.UTF8Encoding]::new($false))
Write-Output "BUILD COMPLETE"
