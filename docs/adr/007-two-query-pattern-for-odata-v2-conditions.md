# ADR-007: Two-query pattern for OData V2 condition records

## Status

Accepted

## Context

The S/4 HANA condition record service (`API_SLSPRICINGCONDITIONRECORD_SRV`) is an OData V2 service. The relevant data is split across two entities:

- `A_SlsPrcgCndnRecdValidity` — holds filter-relevant fields: `Personnel`, `Customer`, `EngagementProject`, `YY1_Mandantengruppe_PCI`, validity dates, and `ConditionType`.
- `A_SlsPrcgConditionRecord` — holds rate fields: `ConditionRateValue`, `ConditionRateValueUnit`, `ConditionQuantityUnit`, `ConditionCurrency`, `ConditionTable`.

The natural approach would be a single query with `$expand` or `columns()` spanning both entities. However, CAP's OData V2 remote service adapter does not reliably support cross-entity column selection or `$expand` in the way CQN `columns()` implies for V2 services. Attempting `$expand` caused runtime errors or empty results.

## Decision

Issue **two sequential queries** against the service:

1. Query `A_SlsPrcgCndnRecdValidity` with all business filters (condition type, Personnel, Customer, EngagementProject, Mandantengruppe).
2. Collect the unique `ConditionRecord` IDs from step 1, then query `A_SlsPrcgConditionRecord` with an `in` filter on those IDs.
3. Join the two result sets in memory using a `Map<ConditionRecord, record>`.

This is implemented in `srv/lib/condition-record.js`.

## Consequences

- Avoids OData V2 `$expand` and cross-entity `columns()` compatibility issues with CAP remote services.
- Two network round-trips per request instead of one. This is acceptable given current data volumes (employees typically have fewer than 20 condition records).
- The in-memory join is simple and predictable: O(n) map lookup after both queries complete.
- Any number of matching validity records results in exactly two total queries, regardless of result set size.
- If the first query returns zero results, the second query is skipped entirely (early return).
