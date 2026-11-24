# Akimbo Website

The public site and client portal for Akimbo Technology LLC, an infrastructure-focused MSP, with NetBox as the source of truth for customer infrastructure.

## Language

**Customer**:
An organization the MSP provides managed infrastructure services to; represented in NetBox as exactly one Tenant.
_Avoid_: Client, account, tenant (outside NetBox context)

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
