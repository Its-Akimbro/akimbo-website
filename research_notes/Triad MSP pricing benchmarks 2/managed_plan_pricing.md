# Monthly managed-services pricing for an infrastructure-only MSP (Piedmont Triad, NC, with national benchmarks)

Research date: 2026-11-24.

How the local evidence was gathered:
- **Firm sites:** about 31 Triad-based or Triad-serving MSP websites. Each homepage and common pricing paths (/pricing, /plans, /managed-it-services and similar) were downloaded as static HTML and scanned for dollar amounts and pricing language.
- **Directories:** firm names came from directory pages (ComparEMSP, Expertise.com and Jumpfactor), which were scanned the same way.
- **Pages fetched in full:** the key pages were also fetched individually.
- **Limitation:** a static-HTML scan misses prices rendered by JavaScript or kept on deeper pages, so "no price found" means "no price on the homepage or the usual pricing URLs".

Labels used below:
- **LOCAL**: a Triad firm.
- **NC**: elsewhere in North Carolina.
- **SE**: the Southeast.
- **NATIONAL**: national data or another region.
- **Fetched**: the page was read in full.
- **Scanned**: the page was found by the HTML scan.
- **Snippet**: search result only.

---

## 1. Which Triad-area MSPs publish prices, what are they, and what share hide pricing behind a quote?

### Takeaway
Of about 31 Triad-based or Triad-serving MSPs checked, only **one** publishes its own business plan prices on its site: Greensboro IT Solutions, with $99 / $199 / $299 / $499 per month tiers, and that page is of low reliability.
- About **4 (≈13%)** publish only a "typical market range". These cluster at **$100–$300 per user per month** for full managed IT that includes help desk.
- About **26 (≈84%)** are quote-only: "flat monthly fee", "custom quote" or "free assessment", with no figures.
- No Triad firm publishes a network-only or server-only monthly rate card.

### Cited Findings

**Firms that publish a dollar figure of some kind**

- **Greensboro IT Solutions** (LOCAL; manageditservicesgreensboro.com, 806 Green Valley Rd Suite 201, Greensboro). Scanned.
  - It publishes these tiers:

    | Tier | Price | What it adds | Size |
    |---|---|---|---|
    | Basic | **$99/mo** | Help desk and virus removal | — |
    | Standard | **$199/mo** | Network maintenance | — |
    | Premium | **$299/mo** | Backups and 24/7 monitoring | "10-20 users" |
    | Enterprise | **$499/mo** | Full suite, custom SLAs | "50+ users" |

  - Setup fees are **$200–$500**, with "no contracts".
  - It also quotes a Cisco Meraki network setup at **$1,500 one-time plus $150/month maintenance**, which is the only local network-management price I found.
  - Caveats: the unit (per company or per user) is ambiguous. The copy reads like templated SEO text, citing a "2022 Deloitte study" and "CrowdStrike blocks 99%". The firm's identity is thin. Treat these prices as unreliable.
  - Sources: [Greensboro IT Solutions, small-business page](https://www.manageditservicesgreensboro.com/it-support-for-small-businesses/); [FAQ](https://www.manageditservicesgreensboro.com/faq/managed-it-services/)
- **Trinity Solutions** (LOCAL; High Point; serves Winston-Salem and Greensboro). Fetched/scanned.
  - Its Winston-Salem page says managed IT "typically range[s] from **$100 to $300 per user per month** depending on what's included. For a 20-person office that might be **$2,000–$5,000 per month**."
  - It builds custom plans after an assessment and publishes no firm price of its own.
  - Sources: [Trinity Winston-Salem](https://trinitysolutionsinc.com/managed-it-services-in-winston-salem/); [Trinity Greensboro](https://trinitysolutionsinc.com/managed-it-services-in-greensboro/)
- **VC3** (NATIONAL firm with a Winston-Salem location page). Scanned.
  - The location page links VC3's guide, which says managed IT runs **$99–$250/user/month**.
  - The guide (published 2024-03-17) also gives per-device figures, covered in section 2.
  - Sources: [VC3 Winston-Salem](https://www.vc3.com/managed-it-service-provider/north-carolina/winston-salem); [VC3 cost guide](https://www.vc3.com/blog/managed-it-services-cost-pricing)
- **Partners Consulting Group** (NC; Asheboro, on the edge of the Triad). Fetched.
  - A blog post dated 2026-02-03 says comprehensive managed IT "typically run[s] **$100 to $250 per user per month** in the Piedmont Triad, Raleigh-Durham, and Charlotte areas".
  - It also gives a guideline of total IT spend at 4–7% of gross revenue.
  - It publishes no per-device, per-site, per-server or own-plan prices.
  - Source: [Partners CG](https://partnerscg.com/blog/managed-it-cost-small-business-north-carolina/)
- **Petronella Technology Group** (NC; Raleigh-based, with Triad landing pages). Scanned.
  - Its plans page has three per-seat tiers with **no dollar amounts**: "Starting at a per-seat monthly rate -- request a scope call."
  - It offers month-to-month or annual terms, with annual carrying "a lower effective per-seat rate".
  - Source: [Petronella plans](https://petronellatech.com/it-services/managed-it-services-plans/)
- **Piedmont Technical Experts** (LOCAL; Greensboro). Fetched.
  - It has a public price list, but it covers **residential** services only. The one monthly plan is "Hometown Tech Care" at **$74.99 per month per computer**.
  - Hourly rates are remote $125/hr and onsite $150/hr.
  - The page says: "business clients, please contact us for pricing."
  - Its business plans are named but carry no prices: PTE CarePartner IT, TrustLine IT, MissionCare IT, PlantSafe IT and others.
  - Source: [PTE price list](https://piedmonttechnicalexperts.com/it-services-greensboro-nc/price-list/)

**Firms that publish a pricing page but no numbers** (an explicit choice not to publish)

- **Preferred Data** (LOCAL; HQ High Point; onsite within 200 miles). Scanned.
  - Its "Plans & Pricing" page has three plans: Preferred Essentials, Professional and Complete.
  - Each is "priced per user per month, quoted for your specific business rather than off a generic rate card".
  - "Your servers, firewalls, switches, wireless access points, and storage devices are counted during discovery and covered at your plan level."
  - Included technician hours are **2, 4 or 8 per month** for the whole account. Headline: "Priced for your business, not a rate card."
  - Source: [Preferred Data pricing](https://www.preferreddata.com/pricing)
- **Triad Cyber Solutions** (LOCAL; Greensboro). Scanned.
  - Its pricing page answers "Why is there no price list on this page?" with: "a published tier would either overcharge a simple office network or underprotect a regulated multi-site business. We scope the work, then price it."
  - Source: [Triad Cyber pricing](https://triadcybersolutions.com/pricing)

**Quote-only firms: no dollar figures on the homepage or common pricing paths** (Scanned)

Several of these advertise a model without a number:
- **Navarac** (Winston-Salem): "Affordable Flat Monthly Fee"; "Pricing is based on user count, system complexity, and service level." — [Navarac](https://navarac.com/)
- **Kotori Technologies** (Charleston SC and Winston-Salem): "fixed monthly pricing with no hidden fees". — [Kotori](https://kotoritechnologies.com/services/managed-it)
- **ThinkTech Advisors** (Greensboro): "Flat-rate monthly pricing". — [ThinkTech](https://thinktechadvisors.com/managed-it-services/)
- **Integrid** (Greensboro, since 2019): "Flat-Rate IT Budget". — [Integrid](https://integrid.com/)
- **eFriendly** (Greensboro, 4900 Koger Blvd). Its "B.O.S.S." plan covers "desktops, physical and virtual servers, network, and SaaS" in "one convenient monthly price", with no figure. Fetched. — [eFriendly](https://efriendly.com/)
- **Biz Technology Solutions**: "Flat Fee Unlimited Technical Support". — [Biz Technology Solutions](https://biztechnologysolutions.com/managed-services)

These firms show no price at all:
- **Solace IT Solutions** (Winston-Salem; "Schedule a FREE IT Assessment") — [Solace](https://www.solaceits.com/)
- **MJM IT Services** — [MJM](https://www.mjmitservices.com/)
- **Blue Ridge Cloud** — [Blue Ridge Cloud](https://www.blueridgecloud.com/)
- **VERSA Technologies** — [Versa](https://versasolutions.net/)
- **GeekBox IT** (Greensboro) — [GeekBox](https://geekboxit.com/)
- **ATCOM** (Greensboro) — [ATCOM](https://atcombts.com/)
- **ComTech**, now Harbor IT — [ComTech](https://comtechnc.com/)
- **Cypress Networks** — [Cypress](https://cypressnetworks.com/)
- **Dynamic Quest** ("Request a FREE quote") — [Dynamic Quest](https://dynamicquest.com/managed-it-services/)
- **Ideacom NC** — [Ideacom](https://ideacomnc.com/)
- **Innovative Technology Solutions** — [ITS of NC](https://itsofnc.com/)
- **Pinnacle EMS** — [Pinnacle](https://pinnacleems.com/)
- **Solve IT Security** — [Solve IT](https://solveitsecurity.com/)
- **Computer Troubleshooters** — [Computer Troubleshooters](https://technology-solved.com/)
- **Triad Technology Services**, whose domain now presents as Thrive — [triadts.com](https://triadts.com/)
- **CMIT Solutions Greensboro** — [CMIT Greensboro](https://www.cmitsolutions.com/greensboro/)
- **LegetteTech** — [LegetteTech](https://www.legettetech.com/)

Firm names came from directories: [ComparEMSP Winston-Salem](https://www.comparemsp.com/north-carolina/winston-salem/managed-it-services); [Expertise.com Greensboro](https://www.expertise.com/business/managed-service-providers/north-carolina/greensboro); [Jumpfactor Greensboro](https://www.jumpfactor.net/top-managed-it-services-greensboro/)

**Excluded or not checkable**
- Not checkable: Nitor Solutions (no usable static HTML), Personal IT Solutions and Parkway Tech (no response).
- Excluded: Sunrise Technologies (a Microsoft Dynamics partner, not an MSP) and Inteltech (an ERP and M365 reseller; it publishes M365 licence prices only).
- **First Column** appears in Triad searches but is a Northern Virginia/DC MSP. Its site says "firm quote… predictable monthly cost per seat". — [First Column](https://www.firstcolumn.com/)

**Templated, non-local city pages**
- **TekReach Solutions** (Los Angeles/Orange County MSP) has a Winston-Salem city page. It lists "IT Basic **$85**/user/month" and "IT Complete **$120**/user/month", each with a "Base Price $100/month". Scanned.
- It is not a local firm, but a Triad buyer searching for prices would see it.
- Source: [TekReach Winston-Salem](https://tekreach.com/managed-it-services/north-carolina/winston-salem)

**Directory and aggregator figures for Winston-Salem** (low reliability: lead-gen directory, "Updated November 2026") — [bestitmsps Winston-Salem](https://www.bestitmsps.com/us/managed-it/winston-salem/). Scanned.
- Per-user managed IT: **$100–$185/user/mo**.
- Healthcare: $145–$280/user/mo.
- Per-device monitoring: **$75–$160/device/mo**.
- Typical monthly budgets by size:

  | Segment | Users | Monthly budget |
  |---|---|---|
  | Budget SMB | 1–15 | **$1,500–$3,200** |
  | Growth SMB | 15–50 | **$3,200–$8,000** |
  | Regulated / mid-market | 50–150 | **$8,000–$20,000** |

### Inferences
- **Share hiding pricing:**
  - About 26 of 31 (≈84%) Triad-serving MSPs publish no figures at all.
  - About 4 (≈13%) publish only a generic market range.
  - About 1 (≈3%) publishes its own plan prices, and that one site is dubious.
  - Publishing a real "from $X/mo" would make Akimbo close to the only credible local firm doing so.
- **Pressure to address price:** Preferred Data and Triad Cyber both have dedicated "pricing" pages that explain *why* there are no numbers. Local buyers are evidently asking, and competitors feel they must answer even when they won't quote.
- **Local "flat monthly fee" means all-in:** it is help-desk-inclusive, per-user managed IT. Every local anchor buyers will see ($100–$300/user, or $2,000–$5,000 for 20 people) is for a fuller scope than Akimbo's infrastructure-only offer.
- **Network gear is usually not a separate line locally:** Preferred Data counts network devices in discovery and covers them "at your plan level", rather than pricing them as a separate product.

### Gaps
- The static scan cannot see JavaScript-rendered prices or deep pages. A few sites (Nitor, Blue Ridge Cloud, MJM, LegetteTech) returned very small pages and may be under-sampled.
- I found no Triad MSP selling a stand-alone network-only or server-only managed plan with a published price, apart from the dubious Greensboro IT Solutions Meraki line.
- I could not verify the legal entity behind manageditservicesgreensboro.com.

---

## 2. Typical national per-user and per-device rates (2024–2026), and infrastructure- or network-only device rates

### Takeaway
Full managed IT that includes help desk is benchmarked nationally at about **$100–$185/user/month**, with an average of about **$145** (2026 directory survey, NATIONAL).

Infrastructure line items are an order of magnitude smaller:

| Item | Typical range per month |
|---|---|
| Firewall | $25–$75 |
| Switch | $15–$40 |
| Access point | $15 |
| Network base, per site | $125–$330 (simple) up to $650 (complex) |
| Server | $100–$325 (cluster about $150–$250) |
| VM | $125–$225 |
| Hypervisor host | about $250 |

VC3 says pure "server and network monitoring" runs about **$30–$50 per user** when expressed per user.

### Cited Findings

**Full managed IT, per user (NATIONAL)**

- **Kaseya 2023 Global MSP Benchmark** (n=1,091; 2023 data, older). Fetched.

  | Per user per month | Share of MSPs |
  |---|---|
  | <$50 | 16% |
  | $50–100 | 22% |
  | $101–150 | 17% |
  | $151–200 | 11% |
  | $201–250 | 4% |
  | >$250 | 1% |
  | Do not offer per-user pricing | 28% |

  | Per device per month | Share of MSPs |
  |---|---|
  | <$50 | 20% |
  | $50–100 | 28% |
  | $101–150 | 11% |
  | $151–200 | 5% |
  | $201–250 | 3% |
  | >$250 | 2% |
  | Do not offer per-device pricing | 30% |

  - Predominant billing models: per-user plus per-device combination 26%, per user 21%, value-based fixed fee 14%, per device 13% (down from 17% in 2022), à la carte 12%, tiered bundles 10%.
  - Source: [Kaseya MSP pricing guide](https://www.kaseya.com/resource/msp-pricing-managed-it-services-pricing/)
- **Best IT MSP "2026 MSP Pricing Benchmark"** (n=412 MSPs and buyers, US and Canada, fielded May 2026, published 2026-06-18). Scanned. It is a directory or lead-gen site and its figures are self-reported, so reliability is moderate to low.

  | Service model | Average per user/month | Typical range |
  |---|---|---|
  | Fully managed | **$145** | $110–$185 |
  | Co-managed | **$85** | $55–$120 |
  | Help-desk only | $52 | $35–$70 |
  | Security add-on | $28 | $15–$45 |

  - Pricing model shares: 63% primarily per user, 24% per device, 13% tiered or flat fee.
  - Onboarding averages $1,200 for 25 seats.
  - Source: [bestitmsps 2026 benchmark](https://www.bestitmsps.com/reports/2026-msp-pricing-benchmark/)
- **VC3 guide** (2024-03-17). Scanned.
  - Managed IT runs **$99–$250/user/month**, and full "all-inclusive" agreements **$75–$200/user**.
  - The lowest tier is "pure server and network monitoring services, which usually run around **$30-50 per user per month**", described as alert-only, with remediation billed extra.
  - Source: [VC3](https://www.vc3.com/blog/managed-it-services-cost-pricing)
- **Serenit LLC 2026 guide.** Scanned.

  | Segment | Per user per month |
  |---|---|
  | Under 15 users | $125–$200 |
  | 15–75 users | $100–$175 |
  | 75–300 users | $125–$225 |

  - It says "Anything below $80/user is almost certainly missing security essentials."
  - Source: [Serenit](https://serenitllc.com/msp-pricing-guide)
- **Onsite Technical Services** (NATIONAL; Phoenix AZ; Oct 2026): Standard Managed Services is **$150–$200/user/month** all-in. Scanned. — [OTS](https://www.onsite-tech.com/2026/10/18/network-management-separate-line-item-managed-it/)
- **Network Essentials** (NC; Charlotte; 2026). Scanned.
  - Basic $80–$110/user, security-inclusive $110–$150/user, and $150–$200/user at the top.
  - Its minimum engagement is **$2,000/month**.
  - Source: [Network Essentials Charlotte](https://tneus.com/managed-it-services-charlotte-nc-10-questions-answered-for-2026/)
- **Meriplex** (NATIONAL, 2026): co-managed IT runs **$85–$150/user/month** for 100–500 users. Scanned. — [Meriplex](https://meriplex.com/co-managed-it-pricing-what-to-budget-in-2026/)

**Per device and infrastructure line items (NATIONAL unless noted)**

- **VC3** (2024): per-device "all-inclusive" ranges are **$100–$400 per server, $50–$125 per workstation, $30–$75 per firewall, $15–$40 per switch**. Scanned. — [VC3](https://www.vc3.com/blog/managed-it-services-cost-pricing)
- **Serenit** (2026), per-device reference at low / mid / high: managed server (physical or VM) **$100 / $175 / $250**; managed network device (firewall or switch) **$25 / $50 / $100**; desktop $25–$50; laptop $30–$65. Scanned. — [Serenit](https://serenitllc.com/msp-pricing-guide)
- **QuantComps** publishes a full modular rate card with a live estimator (location not stated on the page; © 2026). Scanned.
  - **Managed Network is $149 per location per month.** That includes 1 firewall or gateway, 1 managed switch, up to 3 APs, 1 MDF room, monitoring, config and firmware management, VPN and VLAN admin, and ISP coordination.
  - Add-ons: +$45 per additional firewall, **+$30 per switch**, **+$15 per AP**, +$50 per extra IDF/MDF room, +$25 for secondary WAN.
  - **Servers:** Core $175, Business $225, Critical $325 per server per month.
  - **VMs:** from $125 (Core), $175 (Business) and $225 (Critical) per VM per month.
  - **Hypervisor or virtualisation host management:** from $250 per month.
  - Network-only clients are not billed per computer. Endpoint plans are $99 / $149 / $199 per computer.
  - Source: [QuantComps pricing](https://quantcomps.com/pricing)
- **Micro-IT** (NATIONAL; remote-first, offices in Illinois and Kentucky). It publishes every price. Scanned.
  - **Managed Site, per location per month:** Small **$149** (1 onsite hour), Standard **$329** (3 hours), Complex **$649** (6 hours). It covers the firewall, switches and wireless.
  - Additional sites get 5% off each.
  - **Managed Server: $149/server/month.** Endpoint $79/device; mailbox $20.
  - Source: [Micro-IT](https://micro-it.net/resources/article-it-cost)
- **Onsite Technical Services** (Phoenix): network management is **$50–$200 per site per month** for client-owned firewall, switches and APs, or **$150–$400 per site** if OTS supplies the hardware. Scanned. — [OTS](https://www.onsite-tech.com/2026/10/18/network-management-separate-line-item-managed-it/)
- **Sequentur** (New York area; 2026-05-13). Scanned.
  - A typical managed-network engagement runs **$400–$1,500/month** for the network layer of a single site: firewall, Wi-Fi, switch monitoring and security baseline.
  - Multi-site runs **$1,500–$5,000**. Heavy compliance or many sites runs $5,000–$15,000.
  - SD-WAN or MPLS adds $200–$2,000 per site.
  - Source: [Sequentur](https://www.sequentur.com/managed-network-services-for-small-business)
- **Directory figures:** bestitmsps (Winston-Salem) gives per-device monitoring at **$75–$160/device/mo**. That is likely endpoint-weighted and conflicts with the lower network-device figures above. — [bestitmsps W-S](https://www.bestitmsps.com/us/managed-it/winston-salem/)

### Inferences
- **"Per device" means two different things:**
  - Endpoint all-in pricing, such as Kaseya's $50–$100 mode and the directory's $75–$160, includes help desk.
  - Infrastructure device management (firewall, switch, AP) runs **$15–$75 per device**.
  - Akimbo should benchmark against the second.
- **Per-server rates converge on about $150–$250/month:** Micro-IT $149, QuantComps $175–$325, Serenit mid $175, VC3 $100–$400.
- **Explicit per-VM and per-host pricing exists:** QuantComps prices VMs from $125 and hosts from $250. Many MSPs instead count each VM as a "server".

### Gaps
- The Kaseya 2024 and 2025 benchmark pricing tables are gated. The 2025 "key findings" blog contains no pricing figures. — [Kaseya 2025 key findings](https://www.kaseya.com/blog/key-findings-from-kaseyas-2025-global-msp-benchmark-report/)
- I found no ConnectWise, Datto or Service Leadership per-device or per-site network figures in public sources.
- QuantComps' geographic location could not be determined from its pricing page.

---

## 3. What pricing model fits a network-plus-servers-only MSP, and what do comparable infrastructure-focused MSPs charge (NC/Southeast where possible)?

### Takeaway
The infrastructure comparables that publish prices all use **per-site/location base plus per-server (and optionally per-VM/host) add-ons**, not per-user:
- QuantComps: $149 per location, plus device add-ons, plus $175–$325 per server.
- Micro-IT: $149 / $329 / $649 per site, plus $149 per server.
- ICTAlly (Nashville): **$125/mo** plus a $500 install.

The closest Southeast comparable is ICTAlly in Nashville, TN. In NC, the only comparable is the low-reliability Greensboro IT Solutions Meraki maintenance line at **$150/mo**.

### Cited Findings
- **ICTAlly** (SE; Nashville, TN; low-voltage and security contractor). Scanned.
  - "Small Business Network Management" is **$125/month** plus a **$500 one-time installation**.
  - The installation includes a network assessment and a "router/firewall, one enterprise-grade Wi-Fi access point, and an 8-port switch, plus configuration… and complete network documentation".
  - It is aimed at restaurants, retail, clinics and offices, and is a single flat price for single- and multi-location clients.
  - Source: [ICTAlly](https://ictally.com/services/small-business-network)
- **Greensboro IT Solutions** (LOCAL, low reliability): Meraki network setup is "$1,500 one-time installation… ongoing maintenance at **$150 per month**". Scanned. — [Greensboro IT Solutions](https://www.manageditservicesgreensboro.com/it-support-for-small-businesses/)
- **QuantComps:** modular per-location network, per-server, per-VM and per-host pricing (figures in section 2). Network-only clients have no per-computer charge. "Project work — quoted separately" covers firewall deployment, Wi-Fi deployment, VLAN design and segmentation. Scanned. — [QuantComps](https://quantcomps.com/pricing)
- **Micro-IT:** the site tier is defined by onsite hours included: 1, 3 or 6 hours for $149, $329 and $649. Additional locations get 5% off each. Servers are flat at $149. Scanned. — [Micro-IT](https://micro-it.net/resources/article-it-cost)
- **Onsite Technical Services** prices network management as a **separate per-site line item** from per-user managed IT, and adding a location adds a new site line. Scanned. — [OTS](https://www.onsite-tech.com/2026/10/18/network-management-separate-line-item-managed-it/)
- **Sequentur** scales network-layer pricing by "the number of managed sites, the complexity of inter-site connectivity, and the security baseline". Scanned. — [Sequentur](https://www.sequentur.com/managed-network-services-for-small-business)
- **The per-user counter-model, locally:**
  - **Preferred Data** (High Point) prices per user and folds network devices and servers into the plan after discovery. — [Preferred Data](https://www.preferreddata.com/pricing)
  - **Petronella** says servers and specialty devices "may be counted differently" from workstations. — [Petronella plans](https://petronellatech.com/it-services/managed-it-services-plans/)
- **VC3** expresses alert-only server and network monitoring as **$30–$50 per user**, and calls it "not terribly useful" because remediation is billed extra. Scanned. — [VC3](https://www.vc3.com/blog/managed-it-services-cost-pricing)
- **Kaseya 2023 model shares:** 10% use tiered bundles such as Gold/Silver/Bronze; 26% combine per user and per device. Fetched. — [Kaseya](https://www.kaseya.com/resource/msp-pricing-managed-it-services-pricing/)

### Inferences
- **Per-site plus per-server suits Akimbo:** infrastructure cost scales with sites, devices and servers, not with headcount. Every published infrastructure comparable uses this structure.
- **Per-user inflates large offices:** VC3's $30–$50/user would put a 100-person single-site office at $3,000–$5,000 for monitoring alone. A per-site model prices the same network at a few hundred dollars.
- **Mapping onto Akimbo's tiers.** These ranges are suggestions derived from the comparables above, not sourced prices:

  | Akimbo tier | Suggested structure | Anchors |
  |---|---|---|
  | **Essentials** | Per-site monitoring, firmware and config backup: about **$125–$200 per site/mo** | ICTAlly $125; QuantComps $149; Micro-IT Small $149; OTS $50–$200 |
  | **Managed** | Full change management, security policy and onsite hours: about **$300–$650 per site/mo** | Micro-IT Standard $329 / Complex $649; OTS $150–$400; Sequentur $400–$1,500 |
  | **Managed + Servers** | Site fee plus about **$150–$250 per physical server/host**, plus about **$100–$150 per VM** (or VMs bundled per host) | Micro-IT $149/server; QuantComps $175–$325/server, $125+/VM, $250/host |

- **Tier differentiation by onsite hours** (the Micro-IT pattern) suits a founder-led local firm and makes tiers easy to compare.
- **Device allowances in the base:** a "from" price per site is defensible if the base includes a stated allowance, as QuantComps does with 1 firewall, 1 switch and 3 APs.

### Gaps
- I found no NC infrastructure-only MSP with a credible published rate card. The closest Southeast comparable is ICTAlly in Nashville, which is a low-voltage contractor rather than a pure MSP.
- I found no data on what share of MSPs offer network-only plans.

---

## 4. What would a 10–100 staff business typically pay per month in total?

### Takeaway
For **full managed IT** (help desk included), local and regional sources put a 10–100 staff business at about **$1,500–$15,000+/month**, typically **$2,000–$5,000 for about 20 people**.

For **infrastructure-only** management, built from published rate cards:

| Office | Typical monthly total |
|---|---|
| Small single-site office, 1 server | **$300–$500** |
| 40-person office, virtualised host | **$500–$1,000** |
| 90-person, two-site office | **$1,100–$2,300** |

That is roughly **10–25%** of the full-managed bills buyers see locally.

### Cited Findings

**Full managed IT totals**

- **Trinity Solutions** (LOCAL): a 20-person office pays "$2,000–$5,000 per month". — [Trinity W-S](https://trinitysolutionsinc.com/managed-it-services-in-winston-salem/)
- **bestitmsps Winston-Salem** (LOCAL directory, low reliability): 1–15 users $1,500–$3,200; 15–50 users $3,200–$8,000; 50–150 users $8,000–$20,000 per month. — [bestitmsps W-S](https://www.bestitmsps.com/us/managed-it/winston-salem/)
- **Network Essentials** (NC; Charlotte), all-in monthly by size: 10–24 employees "from $2,000/month" (its minimum); 25 employees $2,000–$3,750; 50 employees $4,000–$7,500; 100 employees $8,000–$15,000. — [Network Essentials](https://tneus.com/managed-it-services-charlotte-nc-10-questions-answered-for-2026/)
- **Serenit** (NATIONAL): a 15-person team pays $1,875–$3,000/month, a 75-person team $7,500–$13,125, and a 100-person team $9,375–$16,875. — [Serenit](https://serenitllc.com/msp-pricing-guide)
- **OTS** (Phoenix), worked example: 20 users at $150–$200 comes to $3,000–$4,000. Adding network management (single site, client-owned gear, $50–$200) gives a total of **$3,050–$4,200**. The network line is about 2–6% of the bill. — [OTS](https://www.onsite-tech.com/2026/10/18/network-management-separate-line-item-managed-it/)

**Infrastructure-only totals**

- **Sequentur** (NATIONAL): network layer only, single site, $400–$1,500/month; multi-site $1,500–$5,000. — [Sequentur](https://www.sequentur.com/managed-network-services-for-small-business)

### Inferences
These are illustrative totals computed from the published rate cards. They are calculations, not sourced quotes.

- **Scenario A** (about 15 staff, 1 site: 1 firewall, 2 switches, 4 APs, 1 physical server):
  - QuantComps: $149 + $30 + $15 + $175 = **$369/mo**.
  - Micro-IT: Small $149 + $149 = **$298**, or Standard $329 + $149 = **$478**.
  - VC3 per-device: firewall $30–$75, plus 2 switches at $15–$40, plus a server at $100–$400, comes to **$160–$555** with APs unpriced.
- **Scenario B** (about 40 staff, 1 site: 1 firewall, 4 switches, 8 APs, 1 hypervisor host with 3 VMs):
  - QuantComps: network $149 + 3×$30 + 5×$15 = $314; host $250 plus 3 VMs × $125 = $625; total **$939/mo**.
  - Micro-IT: Standard $329 plus servers comes to **$478** (host only) or **$925** (host and VMs each counted as a server).
  - Serenit mid: 5 network devices × $50, plus 4 servers or VMs × $175, comes to **about $950**.
- **Scenario C** (about 90 staff, 2 sites: 1 firewall, 6 switches, 14 APs and 1 IDF at site 1; 1 firewall, 2 switches and 4 APs at site 2; 2 hosts, 8 VMs):
  - QuantComps: site 1 $514 plus site 2 $194 = $708 network; 2 hosts at $500 plus 8 VMs at $1,000; total **about $2,208/mo**.
  - Micro-IT: Complex $649 plus Small at 5% off, about $142, plus servers comes to **about $1,089** (hosts only) or **about $2,281** (VMs counted).
- **Comparison with full managed IT:** these sit at about 10–25% of full managed IT for the same headcount ($2,000–$15,000). A low "from" price is credible as long as the page says clearly that it excludes desktop and help desk.
- **Akimbo's realistic range:** the floor at the small end is about $150–$300/mo (network only, one simple site). Mid-size clients with servers likely land at **$500–$1,500/mo**.

### Gaps
- I found no survey of what 10–100 staff firms actually spend on network- or server-only management, as distinct from full-stack managed IT. All infrastructure totals above are modelled from rate cards.

---

## 5. Does publishing "starting at" prices help or hurt small MSPs?

### Takeaway
I found **no MSP-specific conversion data**.
- MSP marketing commentary is split. The older, widely cited MSP voices (SmarterMSP, Technibble) say don't publish. Newer MSP-written pieces (NeverBlue IT 2024, Shoutex) recommend **starting prices or ranges plus a consult**.
- General B2B buyer surveys consistently rank pricing transparency as the most-wanted website information.
- Two infrastructure-modular MSPs (QuantComps, Micro-IT) now publish full rate cards with live estimators.
- In the Triad, no credible firm publishes prices, so doing so is a differentiator.

### Cited Findings
- **SmarterMSP** argues the website's job is lead generation and "a posted price gives prospects less of a reason to pick up the phone", and recommends showing results and ROI instead. Snippet; date not verified, and a prior pass flagged it as about 2020–2022, so older. — [SmarterMSP](https://smartermsp.com/keep-your-prices-off-your-msp-website/)
- **Technibble** (an older post) advises against posting MSP prices, partly because a bare number can look too high without context. Snippet. — [Technibble](https://www.technibble.com/advertise-msp-pricing-online/)
- **NeverBlue IT** (MSP in Florida and Michigan; published 2024-02-20, updated 2024-06-03). Fetched.
  - Its arguments for publishing: trust, lead qualification ("buyers with set budgets see fit quickly"), differentiation, and faster SMB decisions.
  - Its arguments against: customisation, competitors undercutting, and snap judgments before value is shown.
  - It recommends "price ranges or starting prices… and offer a consultation".
  - It cites **no data**, and publishes no prices of its own.
  - Source: [NeverBlue IT](https://www.neverblueit.com/why-msps-dont-show-pricing-on-their-website-and-why-it-matters-to-post-prices/)
- **Shoutex** (MSP marketing guide): "many MSPs benefit from showing a starting price per user", because owners want to know whether they are in budget, and this filters poor fits. If you don't publish, at least explain how pricing works. Snippet. — [Shoutex](https://industry.shoutex.com/msp-it-services/proposals-and-pricing/)
- **Forrester:** without listed pricing, every interested party must talk to sales, and "human engagement so early in the process may needlessly increase customer acquisition costs". It also says you don't need to publish all your pricing. Snippet. — [Forrester](https://www.forrester.com/blogs/prices-public-on-website)
- **General B2B buyer data** (not MSP-specific):
  - TrustRadius, via eMarketer: pricing transparency is the **#1 change** B2B tech buyers want from vendors (45%). — [eMarketer](https://www.emarketer.com/content/b2b-tech-buyers-crave-pricing-transparency)
  - Clutch (2020, older): **25%** of B2B buyers rank transparent cost information as the most important element of a services company website, ahead of case studies (23%). — [Clutch press release](https://clutch.co/press-releases/b2b-buyers-most-concerned-about-transparent-costs-b2b-companies-websites)
  - Mixology, via DesignRush: **74%** want clear, detailed pricing upfront. — [DesignRush](https://news.designrush.com/b2b-pricing-transparency)
  - All three are snippets.
- **MSPs that publish full rate cards:**
  - **Micro-IT**: "Every price is on this page… the SLA published on this page is the SLA printed in your agreement." Scanned. — [Micro-IT](https://micro-it.net/resources/article-it-cost)
  - **QuantComps** has a live "build your stack" estimator. Scanned. — [QuantComps](https://quantcomps.com/pricing)
  - ICTAlly publishes $125/mo. — [ICTAlly](https://ictally.com/services/small-business-network)
  - All three are infrastructure- or modular-priced, which is the case where commentators say publishing is easiest.
- **Local counter-signals:**
  - Triad Cyber Solutions publicly argues that a published tier "would either overcharge a simple office network or underprotect a regulated multi-site business". — [Triad Cyber](https://triadcybersolutions.com/pricing)
  - Preferred Data: "Priced for your business, not a rate card". — [Preferred Data](https://www.preferreddata.com/pricing)

### Inferences
- **Akimbo's offer fits the publishing case:** it is standardised and scales by site, device and server. That is the situation where the pro-publishing arguments (filtering, trust, lower acquisition cost) apply and the main objection (custom scope) is weakest.
- **Suggested framing:** "From $X/mo per site" with "final price confirmed after your audit". It captures the filtering benefit and still routes buyers into the audit conversation.
- **The main risk is mis-anchoring.** Akimbo's numbers will look very low next to local per-user figures ($100–$300/user, $2,000–$5,000/mo). Buyers may assume it replaces full managed IT. The page needs explicit scope language: no desktops and no help desk.
- **Differentiation is likely real but unmeasured:** an estimated 97% or more of credible Triad competitors show no own price.

### Gaps
- I found no MSP-specific A/B test, conversion-rate or lead-quality data on published versus hidden pricing.
- reddit.com (r/msp) was not accessible to the search tool, so practitioner discussion was not captured.
- The anti-publishing MSP sources are older (about 2020–2022) and were not re-fetched this pass.
