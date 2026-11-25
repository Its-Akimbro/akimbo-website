import { describe, expect, it } from "vitest";
import { page, text } from "./dist";

const LEGAL_PATHS = ["/privacy/", "/terms/", "/accessibility/"];

/** The text a visitor reads in a page's main content. */
const mainText = (path: string) => text(page(path).html.querySelector("main")!);

describe("legal pages", () => {
  it("shows an effective date on every legal page", () => {
    const missing = LEGAL_PATHS.filter(
      (path) => !/Effective date:? [A-Z][a-z]+ \d{1,2}, \d{4}/.test(mainText(path)),
    );

    expect(missing).toEqual([]);
  });

  it("marks every legal page as a draft pending attorney review", () => {
    const missing = LEGAL_PATHS.filter(
      (path) => !/draft[^.]*attorney review/i.test(mainText(path)),
    );

    expect(missing).toEqual([]);
  });

  it("has a Privacy Policy naming its processors, retention periods and cookie use", () => {
    const text = mainText("/privacy/");
    // Each item must appear in the policy (#37, spec #28).
    const required: [string, RegExp][] = [
      ["names Cloudflare", /Cloudflare/],
      ["names Turnstile", /Turnstile/],
      ["names Postmark", /Postmark/],
      ["says Postmark open and click tracking is off", /open and click tracking[^.]*\boff\b/i],
      ["names Microsoft 365", /Microsoft 365/],
      ["says the contact form stores nothing", /stores nothing/i],
      ["says no auto-reply is sent", /no (automatic reply|auto-reply)/i],
      ["says personal information is not sold", /do not sell/i],
      ["gives the audit retention", /90 days after/i],
      ["gives the offboarding retention", /30 days after/i],
      ["gives the backup retention", /within 12 months/i],
      ["covers cookies", /strictly necessary/i],
      ["covers Do Not Track", /Do Not Track/],
      ["covers children", /children/i],
    ];
    const missing = required.filter(([, pattern]) => !pattern.test(text)).map(([what]) => what);

    // No state or EU rights sections that would promise processes Akimbo doesn't run.
    const rightsLaws = text.match(/\b(CCPA|CPRA|GDPR)\b/g) ?? [];

    expect({ missing, rightsLaws }).toEqual({ missing: [], rightsLaws: [] });
  });
});
