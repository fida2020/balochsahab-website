# Contact form (GitHub Pages compatible)

The public contact form on `/contact.html` validates:

- Name (required, min 2 chars)
- Email (required, format)
- Company (optional)
- Phone (optional, format)
- Department (routes to professional inbox)
- Subject
- Message (required, min 10 chars)
- Honeypot field `website` (spam protection)

## Default behavior (no backend)

On submit, the browser opens a `mailto:` to the selected department inbox:

- support@balochsahab.com
- sales@balochsahab.com
- billing@balochsahab.com
- info@balochsahab.com
- careers@balochsahab.com
- hello@balochsahab.com

This works on static GitHub Pages with zero server code.

## Recommended production backends

Add `data-form-endpoint="https://YOUR_ENDPOINT"` on the `<form data-contact-form>` element.

Compatible options:

1. **Formspree** — `https://formspree.io/f/xxxxxx`
2. **Getform** — `https://getform.io/f/xxxxxx`
3. **Basin** — form endpoint URL
4. **Cloudflare Workers** — custom POST handler emailing via Resend/Mailgun/SendGrid
5. **Netlify Forms** — only if migrating hosting

If the endpoint fails, the script falls back to mailto.

## DNS mailbox setup

Create mailboxes (or aliases) on balochsahab.com for the six addresses above. Do not use personal Gmail addresses on the public site.
