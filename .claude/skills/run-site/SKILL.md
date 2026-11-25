---
name: run-site
description: Run the Marketing Site locally (Worker, static assets and /api/contact) and drive /contact in a browser. Use to see a page change working, check the contact form end to end, or check what happy-dom can't show (Turnstile tokens, real focus).
---

# Run the Marketing Site locally

`pnpm preview` builds `dist/` and runs the Marketing Worker with `wrangler dev`, the way production serves it. All commands run from `marketing/`.

## 1. Test secrets

The Worker needs `POSTMARK_TOKEN` and `TURNSTILE_SECRET`. Locally they come from `marketing/.dev.vars` (gitignored). Write it with test-only values when it doesn't exist:

```sh
printf 'TURNSTILE_SECRET=1x0000000000000000000000000000000AA\nPOSTMARK_TOKEN=POSTMARK_API_TEST\n' > .dev.vars
```

- `1x0000000000000000000000000000000AA` is Cloudflare's always-passes Turnstile secret. It matches the test site key in `src/contact-form.ts`.
- `POSTMARK_API_TEST` makes Postmark accept and validate the email without delivering it. The Worker logs `"outcome":"sent"` with a message ID.

Use only these values. Real secrets live in Cloudflare and are set from the admin workstation (README, "Secrets and settings the release needs").

## 2. Start the server

Run `pnpm preview` in the background, then wait for its `Ready on http://localhost:8787` line. Stop it with `pkill -f "wrangler dev"` when done.

The Worker's structured log lines (`{"route":"/api/contact","outcome":…}`) are in the server's output: the outcome of every submission.

## 3. Check without a browser

```sh
curl -s -X POST http://localhost:8787/api/contact \
  -H 'content-type: application/json' \
  -d '{"kind":"enquiry","name":"Test","email":"test@example.com","message":"Local check","cf-turnstile-response":"XXXX.DUMMY.TOKEN.XXXX"}'
```

Expect `{"ok":true}`. Drop `content-type: application/json` and send urlencoded to check the no-JavaScript path, which answers with a 303 to `/contact/thanks/`.

## 4. Drive /contact in a browser

Load the browser skill for the tool this session has (`claude-in-chrome` or `anthropic-skills:built-in-browser`). Without one, report that the browser checks are still open.

On `http://localhost:8787/contact/?service=managed-networking`:

- Each tab's Turnstile widget has a token: a `cf-turnstile-response` input with a value, including the General enquiry tab's widget when its panel started hidden.
- Tab and the arrow, Home and End keys move through the tabs. Tab goes from the selected tab into its panel.
- The service is preset and the General enquiry tab is open.
- Sending an empty form moves focus to the first field with an error.
- A valid send shows "Thanks for getting in touch" in the page, with focus on it.

Report each check as passed or failed, with what you saw.
