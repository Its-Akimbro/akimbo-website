// The slice of Cloudflare Turnstile's browser API the contact page uses. The
// script (loaded only on /contact) defines `window.turnstile`.
interface Window {
  turnstile?: {
    /** Clear the widget and fetch a fresh token. Takes a widget ID or its container. */
    reset(widget: string | HTMLElement): void;
  };
}
