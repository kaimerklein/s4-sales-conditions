# ADR-008: Multi-service enrichment pipeline for condition details

## Status

Accepted

## Context

Condition records from S/4 HANA contain IDs but not human-readable names or derived attributes. To produce a complete, user-facing result, data must be fetched from several supplementary services:

- `EngagementProject` on a condition record does not include the associated `Customer`. This must be resolved via `SC_EXTERNAL_SERVICES_SRV/ProjectSet`.
- `Customer` IDs on condition records do not include names or `Mandantengruppe` groupings. These must be resolved via `API_BUSINESS_PARTNER/A_BusinessPartner`.
- `PersonWorkAgreement` IDs do not carry employee names or cost centres. These come from `YY1_TT_PERSONWORKAGREEMENT_CDS`.

Inlining all this logic into a single handler function would make it long and hard to test independently.

## Decision

Implement a **sequential enrichment pipeline** in the `EmployeeConditions` READ handler:

1. Resolve `WorkerId` → `PersonWorkAgreement` IDs via `worker-mapping.js`.
2. Fetch condition records for those agreements via `condition-record.js`.
3. For project-level conditions (`PriceLevel = 'Project'`) that have no `Customer`, batch-look up `EngagementProject → Customer` via `project-lookup.js`.
4. Collect all unique `Customer` IDs across all conditions and batch-fetch name + Mandantengruppe via `business-partner-lookup.js`.

For the `Employees` (list) handler, step 4 of the above is replaced by fetching employee metadata via `employee-lookup.js`.

Each step is:
- Encapsulated in a dedicated `srv/lib/` module (one module per external service).
- A soft-failure: lookup errors are caught, logged with `console.warn`, and return empty strings/maps rather than surfacing an error to the caller.
- Batch-oriented: IDs are collected across all records before issuing a single batched lookup per service.

## Consequences

- Up to four external service calls per `EmployeeConditions` request in the worst case (condition records → project lookup → business partner lookup, plus worker mapping).
- Soft failures on enrichment steps mean partial data is returned rather than a request error, which is acceptable for a display use case — a missing customer name does not block showing the condition rate.
- Each enrichment module is independently unit-testable by mocking only `cds.connect.to` for that one service.
- New enrichment steps follow the established pattern: add a lib module, call it in the handler, pass the result map through to the mapping step. No restructuring of the pipeline is needed.
- Batching IDs before lookup avoids N+1 query problems; the number of external calls is bounded by the number of enrichment steps, not by the number of condition records.
