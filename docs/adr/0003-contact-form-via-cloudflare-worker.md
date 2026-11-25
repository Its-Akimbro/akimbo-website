# Marketing Site contact form is handled by a Cloudflare Worker, not on Proxmox

The Marketing Site is static and ships before the Client Portal, so its `/contact` form ("Book an audit" and "General enquiry") posts to a small Cloudflare Worker on `akimbo.technology/api/contact`. The Worker verifies Turnstile, validates fields, and sends one email via Postmark's enquiry stream to the `hello@` shared mailbox; it stores nothing. This is a deliberate exception to "everything self-hosted on Proxmox": enquiries keep arriving when the home host or connection is down, and the portal doesn't have to launch early just to receive a form.

## Considered Options

- **Django Client Portal route**: rejected; couples the first-launched app to the second, makes enquiries depend on home uptime, and needs cross-origin CSRF/CORS handling.
- **Third-party form service** (Formspree, Basin): rejected; another data processor in the Privacy Policy, a monthly fee, and less control over spam and the Postmark stream.

## Consequences

- The repo gains a small TypeScript Worker (`marketing/worker/`) deployed with Wrangler; its Postmark server token and Turnstile secret live in Worker secrets, not with the portal's secrets.
- No auto-reply is sent to the submitter, so the form can't be abused to send mail to arbitrary addresses.
