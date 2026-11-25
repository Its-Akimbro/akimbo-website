# Akimbo Website

The public site and client portal for Akimbo Technology LLC, an infrastructure-focused MSP, with NetBox as the source of truth for customer infrastructure.

## Language

**Customer**:
An organization on a Plan, which the MSP provides managed infrastructure services to; represented in NetBox as exactly one Tenant.
_Avoid_: Client, account, tenant (outside NetBox context)

**Audit Client**:
An organization that has bought a Network Audit but not (yet) signed a Plan; becomes a Customer on signing.
_Avoid_: Prospect, lead, Customer

**Network Audit**:
The fixed-price, one-site assessment of a business's infrastructure that is the MSP's entry offer; its report belongs to the buyer.
_Avoid_: Assessment, health check, IT audit

**Plan**:
A month-to-month managed-services subscription for a Customer's sites, in one of three tiers: Essentials, Managed, or Managed + Servers.
_Avoid_: Contract, package, subscription

**Portal User**:
A person who logs into the Client Portal on behalf of exactly one Customer.
_Avoid_: User, login, account

**Marketing Site**:
The public, unauthenticated part of the website describing the MSP's services.
_Avoid_: Homepage, landing site

**Client Portal**:
The authenticated part of the website where Portal Users view their Customer's infrastructure.
_Avoid_: Dashboard, customer area

**Source of Truth**:
NetBox, the single authoritative record of every Customer's infrastructure; the website displays it and never writes back.
_Avoid_: Database, CMDB
