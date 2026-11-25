# Coding standards

Judgement calls for review. Anything a check can enforce lives in lint, the type check or the tests instead (for example, the brand red rule in `marketing/test/unit/brand-red.test.ts`).

## Comments and names

- A comment says **why**: the reason, the constraint, the gotcha. The code already says what.
- Every export has a JSDoc line in plain words, as the neighbouring modules do.

## One source of truth

- A fact has one home, and every page, script and the Worker read it from there:
  - site-wide facts: `src/site.ts`
  - prices and terms: `src/pricing.ts`
  - service slugs: `src/services.ts`
  - placeholders: `src/placeholders.ts`
- The contact contract (field names, length caps, validation rules, and the copy a visitor sees on success or failure) lives in `src/contact-form.ts`. The forms, the page script and the Worker each read it. None restates it.

## Tests

- Tests sit at the README's seams: 1 the Worker's fetch handler, 2 the built `dist/`, 3 the contact page script on the built page.
- A test acts as a visitor would, through roles, labels and keys, and names the behaviour it checks.
- An expected value is a literal from the spec or a worked example, never recomputed the way the code computes it.

## Page scripts

Scripts are progressive enhancement. The plain HTML path keeps working with the script absent or broken.

- **Every failure offers a way through.** Every failure path shows the `mailto:` fallback, including a Turnstile widget that never loads, so an Enquiry is never silently lost.
- **Nothing sends while an error is known.** That includes errors on fields the visitor can't see.
- **Focus always sits on something real.**
  - Mark a busy control `aria-disabled` and guard it in code; `disabled` drops the focus it holds.
  - After an error, move focus to the first invalid field.
- **Live regions are in place before their content changes.** While empty, hide them with `sr-only`, never `display: none` or `hidden`, which takes them out of the accessibility tree.
- **Each message is announced once.** Use either a live region or a focus move, not both on the same element.
