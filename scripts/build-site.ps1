$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Administrator\tiktok-verification"
. ".\scripts\chrome.ps1"
$bodies = "C:\Users\Administrator\tiktok-verification\scripts\bodies"

function Build-FromBody($rel, $title, $desc, $canon, $bodyFile, $extra = "") {
  $path = Join-Path $bodies $bodyFile
  if (!(Test-Path $path)) { throw "Missing body: $bodyFile" }
  $body = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  Write-SitePage $rel $title $desc $canon $body $extra
}

function BreadcrumbSchema($itemsJson) {
  return "<script type=`"application/ld+json`">$itemsJson</script>"
}

$schema = [IO.File]::ReadAllText((Join-Path $bodies "schema.html"), [Text.Encoding]::UTF8)

Build-FromBody "index.html" "Baloch Sahab Automation | AI Social Media Automation SaaS" "Premium AI-powered social media automation for TikTok and major platforms. Public SaaS with Starter, Professional, Business, and Enterprise plans." "/index.html" "home.html" $schema
Build-FromBody "features.html" "Features | Baloch Sahab Automation" "Explore AI content, smart scheduling, multi-platform sync, analytics, and secure workspaces from Baloch Sahab Automation." "/features.html" "features.html"
Build-FromBody "solutions.html" "Solutions | Baloch Sahab Automation" "Solutions for creators, agencies, and brands automating TikTok and social publishing with Baloch Sahab Automation." "/solutions.html" "solutions.html"
Build-FromBody "pricing.html" "Pricing | Baloch Sahab Automation" "Starter `$9, Professional `$19, Business `$49 per month, plus Enterprise Contact Sales for AI social media automation." "/pricing.html" "pricing.html"
Build-FromBody "about.html" "About | Baloch Sahab Automation" "Learn about Baloch Sahab Automation - a public AI SaaS company building premium social media automation." "/about.html" "about.html"
Build-FromBody "company.html" "Company | Baloch Sahab Automation" "Company overview for Baloch Sahab Automation - public SaaS for social media automation." "/company.html" "company.html"
Build-FromBody "mission.html" "Mission | Baloch Sahab Automation" "Our mission: premium, reliable AI social media automation for creators and businesses." "/mission.html" "mission.html"
Build-FromBody "vision.html" "Vision | Baloch Sahab Automation" "Our vision for the future of elegant, trustworthy social media automation." "/vision.html" "vision.html"
Build-FromBody "services.html" "Services | Baloch Sahab Automation" "Services from Baloch Sahab Automation - AI content, scheduling, multi-platform publishing, and support." "/services.html" "services.html"
Build-FromBody "resources.html" "Resources | Baloch Sahab Automation" "Resources hub - documentation, blog, FAQ, help center, and security policies." "/resources.html" "resources.html"
$faqExtra = ""
$faqSchemaPath = Join-Path $bodies "faq-schema.html"
if (Test-Path $faqSchemaPath) { $faqExtra = [IO.File]::ReadAllText($faqSchemaPath, [Text.Encoding]::UTF8) }
Build-FromBody "faq.html" "FAQ | Baloch Sahab Automation" "Frequently asked questions about Baloch Sahab Automation pricing, platforms, privacy, and support." "/faq.html" "faq.html" $faqExtra
Build-FromBody "support.html" "Support | Baloch Sahab Automation" "Professional support for Baloch Sahab Automation - email directories, WhatsApp, Help Center, and documentation." "/support.html" "support.html"
Build-FromBody "help-center.html" "Help Center | Baloch Sahab Automation" "Help Center for Baloch Sahab Automation - guides, billing, security, and contact options." "/help-center.html" "help-center.html"
Build-FromBody "contact.html" "Contact | Baloch Sahab Automation" "Contact Baloch Sahab Automation via WhatsApp, professional email inboxes, or the production contact form." "/contact.html" "contact.html"
Build-FromBody "privacy-policy.html" "Privacy Policy | Baloch Sahab Automation" "Privacy Policy for Baloch Sahab Automation - how we collect, use, and protect personal information." "/privacy-policy.html" "privacy.html"
Build-FromBody "terms-of-service.html" "Terms of Service | Baloch Sahab Automation" "Terms of Service for Baloch Sahab Automation public SaaS website and product." "/terms-of-service.html" "terms.html"
Build-FromBody "cookie-policy.html" "Cookie Policy | Baloch Sahab Automation" "Cookie Policy for Baloch Sahab Automation explaining how cookies and similar technologies are used." "/cookie-policy.html" "cookie.html"
Build-FromBody "refund-policy.html" "Refund Policy | Baloch Sahab Automation" "Refund Policy for Baloch Sahab Automation subscription plans and billing." "/refund-policy.html" "refund-policy.html"
Build-FromBody "acceptable-use-policy.html" "Acceptable Use Policy | Baloch Sahab Automation" "Acceptable Use Policy for Baloch Sahab Automation - prohibited activities and platform compliance." "/acceptable-use-policy.html" "acceptable-use-policy.html"
Build-FromBody "sla.html" "Service Level Agreement | Baloch Sahab Automation" "Service Level Agreement for Baloch Sahab Automation including uptime targets and support response goals." "/sla.html" "sla.html"
Build-FromBody "security-policy.html" "Security Policy | Baloch Sahab Automation" "Security Policy for Baloch Sahab Automation - HTTPS, access controls, and data protection practices." "/security-policy.html" "security-policy.html"
Build-FromBody "responsible-disclosure.html" "Responsible Disclosure | Baloch Sahab Automation" "Responsible disclosure policy for reporting security issues to Baloch Sahab Automation." "/responsible-disclosure.html" "responsible-disclosure.html"
Build-FromBody "404.html" "Page Not Found | Baloch Sahab Automation" "The page you requested could not be found on Baloch Sahab Automation." "/404.html" "404.html"
Build-FromBody "app/index.html" "App | Baloch Sahab Automation" "Access Baloch Sahab Automation - contact us to get started." "/app/index.html" "app.html"
Build-FromBody "blog/index.html" "Blog | Baloch Sahab Automation" "Insights on AI social media automation from Baloch Sahab Automation." "/blog/index.html" "blog-index.html"
Build-FromBody "blog/ai-content-automation.html" "AI Content Automation | Baloch Sahab Automation" "How AI content automation helps creators publish consistently across platforms." "/blog/ai-content-automation.html" "blog-post.html"
Build-FromBody "docs/index.html" "Docs | Baloch Sahab Automation" "Documentation for Baloch Sahab Automation." "/docs/index.html" "docs-index.html"
Build-FromBody "docs/getting-started.html" "Getting Started | Baloch Sahab Automation" "Getting started guide for Baloch Sahab Automation." "/docs/getting-started.html" "docs-start.html"
Build-FromBody "docs/architecture.html" "Architecture | Baloch Sahab Automation" "Architecture overview for Baloch Sahab Automation." "/docs/architecture.html" "docs-arch.html"

$urls = @(
  "/", "/index.html", "/features.html", "/solutions.html", "/pricing.html", "/about.html", "/company.html", "/mission.html", "/vision.html",
  "/services.html", "/resources.html", "/faq.html", "/support.html", "/help-center.html", "/contact.html",
  "/privacy-policy.html", "/terms-of-service.html", "/cookie-policy.html", "/refund-policy.html", "/acceptable-use-policy.html",
  "/sla.html", "/security-policy.html", "/responsible-disclosure.html", "/blog/index.html", "/blog/ai-content-automation.html",
  "/docs/index.html", "/docs/getting-started.html", "/docs/architecture.html"
)
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($u in $urls) {
  $prio = if ($u -eq "/" -or $u -eq "/index.html") { "1.0" } elseif ($u -match "privacy|terms|cookie|refund|acceptable|sla|security|responsible") { "0.5" } else { "0.8" }
  [void]$sb.AppendLine("  <url><loc>https://balochsahab.com$u</loc><changefreq>weekly</changefreq><priority>$prio</priority></url>")
}
[void]$sb.AppendLine('</urlset>')
[IO.File]::WriteAllText((Join-Path $root "sitemap.xml"), $sb.ToString(), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $root "robots.txt"), "User-agent: *`nAllow: /`nDisallow: /app/`n`nSitemap: https://balochsahab.com/sitemap.xml`n", [Text.UTF8Encoding]::new($false))
Write-Output "BUILD COMPLETE"
