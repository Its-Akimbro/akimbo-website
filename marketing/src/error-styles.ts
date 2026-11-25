// The only red outside the audit CTA (brand/theme.css): error messages and
// invalid fields. test/unit/brand-red.test.ts keeps red utilities to this
// file and AuditCta.astro.

/** An error message's text, next to its field or in an alert. */
export const ERROR_TEXT = "text-sm font-medium text-red-dark";

/** A form control's border once it is marked `aria-invalid`. */
export const INVALID_BORDER = "aria-invalid:border-red-dark";
