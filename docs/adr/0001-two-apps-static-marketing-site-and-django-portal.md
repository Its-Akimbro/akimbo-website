# Two apps: a static Marketing Site and a separate Django Client Portal

The Marketing Site is a static Astro build (`marketing/`) and the Client Portal is a separate server-rendered Django app (`portal/`), both in this repo but deployed independently — rather than one Django app serving both. The Marketing Site ships first and needs no backend; keeping it static means the public, unauthenticated surface runs no server code, holds no NetBox tokens and needs no network path to NetBox, and a copy can later be hosted on Cloudflare Pages as an uptime fallback. Only the Client Portal, which must select each Customer's NetBox token server-side, carries that risk.

## Considered Options

- **One Django app for both** (optionally with a CMS like Wagtail): one deploy and one template language, but couples the Marketing Site's release and uptime to the portal and puts public pages on the same process that holds NetBox tokens.
- **django-distill** (render Django templates to static files): shares templates, but ties Marketing Site builds to the portal codebase, defeating the split.

## Consequences

- Shared look is kept in sync through a single Tailwind v4 theme file (`brand/theme.css`) imported by both apps.
- A static Marketing Site can't process an enquiry form itself; contact/enquiry delivery needs its own endpoint.
- Two deploy targets: a static file server and a Gunicorn service.
