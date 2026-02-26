# ADR-006: Employee-centric hierarchical data model

## Status

Accepted

## Context

The initial data model was condition-record-centric: the list report showed individual pricing condition records as flat rows. A typical employee has multiple conditions (project-level, customer-level, Mandantengruppe-level, basic), and browsing a flat list required mental grouping by the user.

Business need: users want to find an employee, then inspect that employee's conditions. A two-level structure — employee overview → employee condition details — maps naturally to a Fiori Elements List Report + Object Page pattern.

Condition records are stored in S/4 HANA against `PersonWorkAgreement` IDs, not employee (worker) IDs. One employee can have multiple `PersonWorkAgreement` records over time.

## Decision

Structure `SalesConditionService` as a two-level hierarchy:

- **`Employees`** (top level) — one row per unique worker. Aggregates `ConditionCount` and carries employee metadata (name, cost center, company code). Backed entirely by in-memory computation across `YY1_RSM_WORKAGRMNT_VAL_IE_CDS`, `API_SLSPRICINGCONDITIONRECORD_SRV`, and `YY1_TT_PERSONWORKAGREEMENT_CDS`.
- **`EmployeeConditions`** (child level) — one row per condition record for a worker. Accessible via the `Conditions` composition navigation from `Employees`, or directly by `WorkerId` filter. Enriched with data from `SC_EXTERNAL_SERVICES_SRV` and `API_BUSINESS_PARTNER`.

The composition `Conditions: Composition of many EmployeeConditions on Conditions.WorkerId = $self.WorkerId` enables Fiori Elements Object Page navigation automatically.

Multiple `PersonWorkAgreement` IDs for the same employee are collapsed under a single `WorkerId` in the result. A reverse lookup (`getWorkerIdsByAgreements`) maps `PersonWorkAgreement` → `WorkerId` when the search starts from customer or project filters rather than from a worker ID.

## Consequences

- The Fiori Elements List Report → Object Page drill-down works out of the box via OData navigation.
- Grouping conditions under a single employee row requires collecting all `PersonWorkAgreements` for a worker before querying conditions, adding one extra remote call when filtering by WorkerId.
- When filtering by Customer or EngagementProject (not by WorkerId), a reverse lookup from `PersonWorkAgreement` to `WorkerId` is required after fetching conditions.
- The `Employees` entity fields `Customer`, `EngagementProject`, and `Mandantengruppe` serve as filter targets only (Fiori Selection Fields); they are not meaningfully populated in the list result because a single employee may have conditions across multiple customers and projects.
