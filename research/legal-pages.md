# Legal pages for the Marketing Site and Client Portal

Research for [#23](https://github.com/Its-Akimbro/akimbo-website/issues/23). Sources were checked on 2026-11-24 against statutes, legislature bill pages and regulator guidance (FTC, DOJ, California Privacy Protection Agency). Each claim cites its source. Where a primary page could not be fetched, the note says so and names the secondary source used.

**This is research, not legal advice.** It sorts out what the law clearly requires from what is only expected practice, so that an attorney review (recommended below) is short and cheap. It does not replace that review.

## Recommendation (TL;DR)

| Page | Status for Akimbo today | Where |
|---|---|---|
| **Privacy Policy** | **Effectively required.** No law clearly forces one on a B2B-only NC MSP at this size, but it is universal practice, and anything it says is legally binding under FTC Act §5 and NC G.S. 75-1.1. | Footer of every page on both apps |
| **Website Terms of Use** | Best practice, not required. | Marketing Site footer |
| **Client Portal Terms of Use** | Best practice, and strongly advised. Portal Users are individuals who did not sign the Plan agreement. | Accepted by click at a Portal User's first login; linked in the portal footer |
| **Cookie notice / banner** | **Not required** if the site uses only strictly necessary cookies and cookieless analytics. A short "Cookies" section inside the Privacy Policy is enough. | Section of the Privacy Policy |
| **Accessibility statement** | Best practice, not required. The obligation is to *be* accessible (ADA Title III, per DOJ), not to publish a statement. | Footer |
| Legal-entity / contact block | Best practice: "Akimbo Technology LLC", a mailing address and an email address. A postal address becomes **required** in any marketing email (CAN-SPAM). | Footer, Privacy Policy |

Not needed now: a CCPA or other state "privacy notice at collection", a "Do Not Sell or Share" link, a GDPR notice, a COPPA notice, a DMCA agent page, or a separate cookie-consent tool.

**Template or lawyer?** Draft the Privacy Policy and Website Terms from a reputable template, edited to describe the real data flows (below). Then get **one fixed-fee review by an NC-licensed business or tech attorney**, and have them draft or review the **Plan service agreement (MSA)**, the **Network Audit agreement** and the **Portal Terms** together. Those contracts carry the real liability for an MSP (limits of liability, security incidents, data ownership, Customer responsibility for its Portal Users). Generic website templates don't cover them.

## 1. Which privacy laws apply

### Federal

- **No general federal law requires a privacy policy.** What exists is enforcement of promises: the FTC treats broken privacy statements as deceptive under Section 5 of the FTC Act. It tells businesses to "reread your privacy policy to make sure you're honoring the promises you've pledged" ([FTC, Privacy and Security business guidance](https://www.ftc.gov/business-guidance/privacy-security)). In practice: **say only what is true, and keep it true.**
- **CAN-SPAM** applies to commercial email, not to the website ([FTC CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)):
  - Transactional or relationship messages are exempt from everything except the rule against false or misleading routing information. Postmark's portal invitations, password resets, enquiry acknowledgements and notices about a Customer's account fall into this group.
  - The categories are read narrowly. If the subject line or opening suggests marketing, the message is treated as commercial.
  - Any marketing email (a newsletter, "new service" announcements) needs: accurate headers, an honest subject line, a disclosure that it is an ad, **a valid physical postal address** (a USPS-registered P.O. box or a CMRA private mailbox is fine), a working opt-out honored within 10 business days, and responsibility for any third-party sender.
  - Penalties are up to $53,088 per email (the 2024 inflation figure on the FTC page).
- **COPPA** does not apply. The site is not directed at children and doesn't knowingly collect their data. *(General knowledge; not separately sourced here.)*

### California (CalOPPA and CCPA)

- **CalOPPA** (Cal. Bus. & Prof. Code §§22575–22579) requires an "operator" of a commercial website that collects personally identifiable information (name, email, phone…) from California "consumers" to conspicuously post a privacy policy ([§22575](https://california.public.law/codes/business_and_professions_code_section_22575), [§22577](https://california.public.law/codes/business_and_professions_code_section_22577); leginfo.legislature.ca.gov blocked automated fetches, so these links go to a mirror of the official text). There is no size threshold.
  - **But** §22577(d) defines "consumer" as an individual acquiring goods or services "for personal, family, or household purposes". An MSP that only sells to businesses arguably collects no "consumer" PII, so CalOPPA arguably **does not apply**. *(This is my reading of the definition, not a regulator's statement. Ask the attorney.)*
  - Because the policy is being written anyway, satisfy CalOPPA's content list as a free safe harbour (§22575(b)): the categories of PII collected; the categories of third parties it is shared with; any review/correction process; how material changes are announced; the effective date; how the site responds to Do Not Track signals; and whether third parties can track users across sites.
  - A violation exists only if the policy isn't posted within 30 days of being notified ([§22575(a)](https://california.public.law/codes/business_and_professions_code_section_22575)).
- **CCPA/CPRA does not apply.** It covers a business only if it has **≥ $26.625M** in annual gross revenue (effective 2025-01-01), buys/sells/shares the personal information of **≥ 100,000** California residents or households, or gets **≥ 50%** of its revenue from selling or sharing personal information ([CPPA FAQ](https://cppa.ca.gov/faq.html), [CPPA CPI adjustment](https://cppa.ca.gov/regulations/cpi_adjustment.html)).
  - Note: unlike most states, the CCPA's B2B and employee exemptions "expired on December 31, 2022" ([CPPA FAQ](https://cppa.ca.gov/faq.html)), so B2B data *would* count if Akimbo ever crossed a threshold.

### Other state comprehensive privacy laws

- **North Carolina has no comprehensive consumer privacy law.**
  - The current bill, **S1022** "Consumer Privacy Act of North Carolina", was filed 2026-04-30. Its last action was a re-referral to Senate Appropriations/Base Budget on 2026-05-05, with no votes ([NCGA S1022](https://www.ncleg.gov/BillLookUp/2025/S1022)).
  - Earlier bills **S757** and **H462** (2025) did not pass either ([S757 text](https://www.ncleg.gov/Sessions/2025/Bills/Senate/HTML/S757v1.html), [H462 text](https://www.ncleg.gov/Sessions/2025/Bills/House/HTML/H462v1.html)).
  - **Recheck at each long session.** If one passes, its thresholds decide whether Akimbo is covered.
- The other states' laws (Virginia, Colorado, Connecticut, Texas, and so on) are **out of reach for now** for three reasons:
  1. **Volume thresholds.** These are typically 100,000 state residents, or 35,000 in the newer or amended laws, far above anything a startup MSP handles. Connecticut's 2025 amendment (SB 1295, in force 2026-07-01) lowered its threshold to 35,000 consumers. It also made the law apply to *anyone* who processes sensitive data or sells personal data, at any volume ([FPF analysis](https://fpf.org/blog/the-connecticut-data-privacy-act-gets-an-overhaul-again/); secondary source, the statute was not fetched). Akimbo does neither, so it should never collect sensitive data such as health or precise location through the site.
  2. **B2B exclusion.** Virginia's definition is typical: "consumer" means a resident "acting only in an individual or household context" and "does not include a natural person acting in a commercial or employment context" ([Va. Code §59.1-575](https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-575/)). Enquirers writing on behalf of a business, Portal Users and Audit Client contacts are all acting in a commercial context. (California is the exception, see above.)
  3. **Small-business exemptions.** Texas (TDPSA) generally exempts SBA-defined small businesses, but they still need consent before *selling* sensitive data ([Texas AG TDPSA page](https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/texas-data-privacy-and-security-act), which returned HTTP 402 to automated fetch; the claim was confirmed through the Texas State Law Library and law-firm summaries in search results). Nebraska has a similar rule. *(Nebraska not separately sourced.)*

### EU/UK GDPR

- **Not targeted, so not in scope.** GDPR reaches a non-EU business that offers goods or services to people in the EU or monitors their behaviour there ([GDPR Recitals 23–24 / Art. 3(2)](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)). Recital 23 says the mere accessibility of a website from the EU is not enough.
- A US-only, NC-focused MSP that targets no EU customers is outside it. Don't add EU-specific language or cookie walls.

### North Carolina laws that *do* apply

- **Unfair and deceptive trade practices, G.S. 75-1.1.** A misleading privacy statement or website claim can be actionable. The breach statute itself makes a violation of it a 75-1.1 violation ([G.S. 75-65](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_75/GS_75-65.html)).
- **Identity Theft Protection Act, breach notice (G.S. 75-60 ff.).** It applies to any business that owns or licenses NC residents' personal information, regardless of size ([G.S. 75-61](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_75/GS_75-61.html), [G.S. 75-65](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_75/GS_75-65.html)).
  - "Personal information" means a name combined with an identifier listed in [G.S. 14-113.20(b)](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_14/GS_14-113.20.html), a list that includes email addresses and passwords. However, §75-65(a) excludes email addresses, internet account names and passwords *unless they would permit access to a person's financial account or resources*. So a breach of Portal User names, emails and password hashes most likely does **not** trigger NC's notice duty. Other states' laws, such as California's, do count username plus password. *(General knowledge; not separately sourced.)*
  - If notice is triggered, it must go out "without unreasonable delay". It must contain a description of the incident, the data types, the remediation steps, a contact number, vigilance advice, the consumer reporting agency contacts and the FTC/NC AG contacts. The NC AG Consumer Protection Division must be told. Where Akimbo *holds* data it doesn't own, it must notify the owner "immediately following discovery" ([G.S. 75-65](https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_75/GS_75-65.html)).
  - That last duty matters most for an MSP: it covers Customer data on managed systems. Put it in the MSA, not on the website.
- NC has no statute requiring an LLC to publish particular disclosures on its website. *(No such statute found; absence is hard to prove, so confirm with the attorney.)*

## 2. Accessibility

- DOJ's position, in its 2022-03-18 guidance: ADA Title III covers the goods and services that public accommodations offer online. It states "The Department of Justice does not have a regulation setting out detailed standards" for businesses, and points to **WCAG** and Section 508 as helpful standards ([ADA.gov web guidance](https://www.ada.gov/resources/web-guidance/)).
- The 2024 Title II rule (WCAG 2.1 AA, with deadlines) binds **state and local governments**, not private businesses. *(General knowledge of the 2024 rule; not fetched.)* If Akimbo ever serves a public-sector Customer, that Customer's own obligations may flow into the contract.
- So: **build to WCAG 2.2 AA** (cheap on a static Astro site) and publish a short **accessibility statement**. Include the target standard, known limitations and a way to report a barrier. The statement is best practice, not a legal requirement.

## 3. Cookies

- Expected cookies:
  - **Cloudflare** may set `__cf_bm` (bot management) and `cf_clearance` (challenge passed), among others. Cloudflare describes these as "strictly necessary to provide the services requested by our customers" and encourages customers to disclose them ([Cloudflare cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/)).
  - **The Django Client Portal** uses session and CSRF cookies, which are strictly necessary for login. *(Django defaults; not separately sourced.)*
- No US law in scope requires a consent banner for strictly necessary cookies.
  - With **cookieless self-hosted analytics** (e.g. Plausible, Umami, or Matomo in cookieless mode), **no banner is needed**. A "Cookies and similar technologies" section in the Privacy Policy is enough.
  - If ad pixels, Google Analytics or embedded third-party trackers are ever added, revisit this. They bring in CalOPPA's cross-site tracking disclosure, and could make GDPR/state law relevant.

## 4. What each page must contain

### Privacy Policy (one policy covering both apps)

1. **Who we are:** Akimbo Technology LLC, North Carolina; a contact email and mailing address.
2. **What we collect, by source:**
   - The enquiry form: name, work email, company, phone, message.
   - Client Portal accounts: Portal User name, email, credential hash, login and audit logs.
   - Technical data: IP addresses and request logs at Cloudflare and the origin; cookies (see the cookies section).
   - Analytics: say exactly what the chosen tool records.
   - Email correspondence in Microsoft 365.
3. **Why:** answering enquiries; providing the Plan or Network Audit; running and securing the Client Portal; sending transactional email; meeting legal obligations.
4. **Customer infrastructure data shown in the portal** (from NetBox) is processed **on the Customer's behalf** under the Plan agreement, and that agreement governs it. Say this so the policy doesn't seem to make promises about Customer data that conflict with the MSA.
5. **Who we share with:** service providers acting for us, by category or by name. Naming them is clearer:
   - Cloudflare (CDN/security)
   - Postmark (transactional email; say whether open or click tracking is on, and prefer it off)
   - Microsoft 365 (email and documents)
   - the hosting provider
   - plus "professional advisers, and where required by law". Say that **we do not sell personal information** and do not use it for targeted advertising, but only while that is true.
6. **Retention:** how long enquiries, portal accounts and logs are kept, or the criteria used.
7. **Security:** a general description. Don't overpromise: "we use reasonable safeguards", not "your data is 100% secure" (FTC §5 risk).
8. **Choices and access:** how to ask for access, correction or deletion (the CalOPPA review/correct item); how Customers remove Portal Users; how to opt out of marketing email if any is ever sent.
9. **Do Not Track and third-party tracking** statements (CalOPPA items 5 and 6). For example: "We do not track visitors across third-party sites, and we do not allow third parties to do so on our site."
10. **Children:** not directed to children under 13.
11. **Changes:** how material changes are announced, and the **effective date**.

### Website Terms of Use (Marketing Site)

- The site's content is information only, not a service offer; services are provided only under a signed Plan or Network Audit agreement.
- Intellectual property in the site and brand; acceptable use; disclaimer of warranties; limitation of liability; links to third-party sites.
- Governing law (North Carolina) and venue; contact details.

### Client Portal Terms of Use (accepted at a Portal User's first login)

The issue asks whether the Client Portal needs its own terms separate from the Plan's service agreement. **Yes, but keep them short, and keep them subordinate to the agreement.**

- **Why:** the Plan agreement binds the *Customer*, but a Portal User is an individual who signed nothing. A one-time click-to-accept at first login (a checkbox plus a link, with the acceptance time and version logged) binds the person directly. Courts generally enforce affirmative click acceptance more readily than terms that are only linked in a footer. *(General legal knowledge; the attorney should confirm the drafting.)*
- **Contents:**
  - Access is granted on behalf of exactly one Customer and ends when that Customer revokes it or the Plan ends.
  - Keep credentials confidential and enable MFA; report suspected compromise.
  - Portal content (infrastructure details) is the Customer's **confidential information**. Use it only for the Customer's business, and do not share it.
  - The data is provided "as is" from Akimbo's records and may lag reality; it is no substitute for change control or incident reporting.
  - Acceptable use: no probing, scraping, or attempts to reach other Customers' data.
  - Akimbo may suspend access for security reasons.
  - **Order of precedence:** if these terms conflict with the Customer's Plan agreement, the Plan agreement wins.
- **Pair it with the MSA.** The Plan agreement should include an "Authorized Users" clause: the Customer chooses its Portal Users, is responsible for their conduct, and tells Akimbo when one leaves. Do the same in the Network Audit agreement if Audit Clients ever get portal access.

### Accessibility statement

- The target standard (WCAG 2.2 AA), the date of the last review, known gaps, and a contact for reporting a barrier, with a response commitment.

## 5. Template vs attorney

- **Templates are fine as a starting point** for the Privacy Policy, Website Terms and Accessibility statement, as long as each one is edited to match the actual data flows above. The FTC risk comes from saying things that aren't true, not from missing boilerplate.
  - Avoid generator output that adds CCPA/GDPR rights sections that don't apply. They promise processes Akimbo would then have to honor.
  - Avoid generators that claim certifications.
- **An attorney is warranted** (NC-licensed, business/technology practice, ideally one fixed-fee engagement) for:
  - the **Plan agreement/MSA** and **Network Audit agreement**: limitation of liability, security incident and breach-notice duties under G.S. 75-65(b), data ownership, and insurance requirements;
  - the **Portal Terms** and how they interlock with the MSA;
  - confirming the judgement calls in this note: that CalOPPA doesn't apply to B2B only, and that NC breach notice doesn't cover portal credentials;
  - any regulated Customers (e.g. healthcare Customers needing a HIPAA business associate agreement). That belongs in the contracts, not the website pages.
- Re-check this note:
  - when NC passes a privacy law;
  - if marketing email starts;
  - if analytics or tracking tools change;
  - if Akimbo targets consumers (residential IT) or EU customers.
