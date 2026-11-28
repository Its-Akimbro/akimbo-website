// Content the owner hasn't supplied yet (spec #28). Every placeholder is
// written as "[TBD: …]" so one search (`grep -r "TBD:"`, in src/ or dist/)
// finds them all before launch. The smoke test fails on any other
// bracketed text, so a placeholder can't slip in marked some other way.

// Placeholder images are in `placeholder-assets.ts`; see the note there.

/** Marks content the owner still has to supply. */
export function placeholder(what: string): string {
  return `[TBD: ${what}]`;
}

export const FOUNDER_NAME = placeholder("Founder name");
/** Shown in place of the founder's photo until there is one. */
export const FOUNDER_PHOTO = placeholder("Founder photo");
export const FOUNDER_STORY = placeholder(
  "Founder story: where you've worked and the kinds of networks you've looked after",
);
export const YEARS_OF_EXPERIENCE = placeholder("Years of experience");
/** Where Akimbo works on site, e.g. a city or region name. */
export const CITY_REGION = placeholder("City/Region");
export const CERTIFICATIONS = [
  placeholder("Certification"),
  placeholder("Certification"),
  placeholder("Certification"),
];
/** The business phone number, shown on the portal's outage page (portal-edge/). */
export const PHONE_NUMBER = placeholder("Phone number");
export const MAILING_ADDRESS = [placeholder("Mailing address line 1"), placeholder("City, NC ZIP")];
