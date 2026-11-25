// Site-wide facts the base layout shows on every page.

export const SITE_NAME = "Akimbo Technology";
export const LEGAL_NAME = "Akimbo Technology LLC";
/** The home page title; other pages are titled "<page> | Akimbo Technology". */
export const HOME_TITLE = `${SITE_NAME} | Managed networks and infrastructure`;
export const DEFAULT_DESCRIPTION =
  "Managed networks, servers and virtualisation for small businesses, with published prices and a fixed-price network audit to start.";

/** The Client Portal is a separate app on its own hostname (ADR 0001). */
export const PORTAL_URL = "https://portal.akimbo.technology/";

export const CONTACT_EMAIL = "hello@akimbo.technology";

/** Placeholder until the owner fills it in before launch (spec #28). */
export const MAILING_ADDRESS = ["[Mailing address line 1]", "[City, NC ZIP]"];

/** The primary call to action on every page. */
export const AUDIT_CTA = { label: "Book a network audit", href: "/contact/" };

/**
 * Header navigation. Each page's ticket adds its entry when the page lands,
 * so the nav never links to a page that doesn't exist.
 */
export const NAV: { label: string; href: string }[] = [];

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy/" },
  { label: "Website Terms", href: "/terms/" },
  { label: "Accessibility statement", href: "/accessibility/" },
];
