# Akimbo Website

The public site and client portal for Akimbo Technology LLC, an infrastructure-focused MSP, with NetBox as the source of truth for customer infrastructure.

## Language

**Customer**:
An organization on a Plan, which the MSP provides managed infrastructure services to; represented in NetBox as exactly one Tenant.
_Avoid_: Client, account, tenant (outside NetBox context)

**Audit Client**:
An organization that has bought a Network Audit but not (yet) signed a Plan; has a NetBox Tenant (which becomes its Customer's Tenant on signing) but no Portal Users; becomes a Customer on signing.
_Avoid_: Prospect, lead, Customer

**Network Audit**:
The fixed-price, one-site assessment of a business's infrastructure that is the MSP's entry offer; its report belongs to the buyer.
_Avoid_: Assessment, health check, IT audit

**Enquiry**:
A message a prospective Audit Client or Customer sends through the Marketing Site's contact form, either an audit request or a general question; it lands in the MSP Staff's shared mailbox.
_Avoid_: Lead, ticket, contact

**Plan**:
A month-to-month managed-services subscription for a Customer's sites, in one of three tiers: Essentials, Managed, or Managed + Servers.
_Avoid_: Contract, package, subscription

**Portal User**:
A person who logs into the Client Portal on behalf of exactly one Customer.
_Avoid_: User, login, account

**Primary Contact**:
The person a Plan agreement names to speak for the Customer; the first Portal User invited, and the only person whose written request adds or removes the Customer's other Portal Users.
_Avoid_: Account owner, admin, main user

**MSP Staff**:
The people who operate Akimbo Technology and its systems (today, only the founder), as distinct from Portal Users.
_Avoid_: Admin, operator, employee

**Marketing Site**:
The public, unauthenticated part of the website describing the MSP's services.
_Avoid_: Homepage, landing site

**Client Portal**:
The authenticated part of the website where Portal Users view their Customer's infrastructure.
_Avoid_: Dashboard, customer area

**Source of Truth**:
NetBox, the single authoritative record of every Customer's infrastructure; the website displays it and never writes back.
_Avoid_: Database, CMDB

**Shared Object**:
Infrastructure recorded in NetBox that serves more than one Customer or the MSP itself (e.g. a colocation Site or a shared Rack), so it belongs to no single Customer.
_Avoid_: Untenanted object, common infrastructure
