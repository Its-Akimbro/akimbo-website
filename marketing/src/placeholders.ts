// Content the owner hasn't supplied yet (spec #28). Every placeholder is
// written as "[TBD: …]" so one search (`grep -r "TBD:"`, in src/ or dist/)
// finds them all before launch. The smoke test fails on any other
// bracketed text, so a placeholder can't slip in marked some other way.

/**
 * The service-area map: a self-hosted image, never a third-party map embed.
 * Swap the file for the owner's map before launch.
 */
export { default as SERVICE_AREA_MAP } from "./assets/service-area-map-placeholder.svg";

/** Marks content the owner still has to supply. */
export function placeholder(what: string): string {
  return `[TBD: ${what}]`;
}

export const FOUNDER_NAME = placeholder("Founder name");
export const YEARS_OF_EXPERIENCE = placeholder("N");
/** Where Akimbo works on site, e.g. a city or region name. */
export const CITY_REGION = placeholder("City/Region");
export const CERTIFICATIONS = [
  placeholder("Certification"),
  placeholder("Certification"),
  placeholder("Certification"),
];
export const MAILING_ADDRESS = [placeholder("Mailing address line 1"), placeholder("City, NC ZIP")];
