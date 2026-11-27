// The "Client Portal temporarily unavailable" page (spec #16, user story 29).
// Its contact facts come from the Marketing Site's own modules, and its
// classes are the Marketing Site's (SiteHeader, SiteFooter), so the two match.
import { LOCKUP_SRC, PAGE_CSS } from "../build/page-assets";
import { SUPPORT_HOURS_TEXT } from "../../marketing/src/pricing";
import { CONTACT_EMAIL, LEGAL_NAME, PHONE_NUMBER, SITE_NAME, SITE_URL } from "../../marketing/src/site";

const TITLE = "Client Portal temporarily unavailable";

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const linkClasses = "text-blue underline hover:text-blue-dark";

// Until the owner supplies the number it is a "[TBD: …]" placeholder, which
// is shown as plain text rather than as a `tel:` link that dials nothing.
const phoneDigits = PHONE_NUMBER.replace(/[^\d+]/g, "");
const phone = /\d{7,}/.test(phoneDigits)
  ? `<a href="tel:${escape(phoneDigits)}" class="${linkClasses}">${escape(PHONE_NUMBER)}</a>`
  : escape(PHONE_NUMBER);

/** The outage page's HTML, built once: it never varies by request. */
export const OUTAGE_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${escape(TITLE)} | ${escape(SITE_NAME)}</title>
    <style>${PAGE_CSS}</style>
  </head>
  <body class="flex min-h-screen flex-col">
    <header class="bg-navy text-white">
      <div class="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <a href="${escape(SITE_URL)}" class="inline-block focus-visible:outline-2 focus-visible:outline-white">
          <img src="${LOCKUP_SRC}" alt="${escape(SITE_NAME)}" width="200" height="50" class="h-auto w-40 sm:w-50" />
        </a>
      </div>
    </header>
    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1>${escape(TITLE)}</h1>
        <p class="mt-4 text-lg">
          The Client Portal is down for maintenance or because of an outage. Please try again in a
          few minutes.
        </p>
        <h2 class="mt-10">Need us in the meantime?</h2>
        <dl class="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
          <dt class="font-semibold">Email</dt>
          <dd><a href="mailto:${escape(CONTACT_EMAIL)}" class="${linkClasses}">${escape(CONTACT_EMAIL)}</a></dd>
          <dt class="font-semibold">Phone</dt>
          <dd>${phone}</dd>
          <dt class="font-semibold">Business hours</dt>
          <dd>${escape(SUPPORT_HOURS_TEXT)}</dd>
        </dl>
      </div>
    </main>
    <footer class="bg-navy text-white">
      <div class="mx-auto max-w-6xl px-4 py-10 text-sm sm:px-6">
        <p class="font-heading font-semibold">${escape(LEGAL_NAME)}</p>
      </div>
    </footer>
  </body>
</html>
`;
