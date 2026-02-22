# ADR-001: Function-based services over entity CRUD

## Status

Accepted

## Context

CAP's default pattern exposes entity sets with full CRUD operations. Our application, however, is a read-only aggregation layer: it queries two external S/4 HANA OData services (`API_SLSPRICINGCONDITIONRECORD_SRV` for condition records and `YY1_RSM_WORKAGRMNT_VAL_IE_CDS` for worker mappings), combines the results, and returns them to the UI. There are no local entities to create, update, or delete.

Exposing entity projections would imply write support and require explicit `@readonly` annotations or reject handlers for every unsupported operation. It would also couple the service interface to the shape of the remote entities.

## Decision

Define CDS services using **functions** (`function getConditionRecords(...)`, `function getWorkAgreement(...)`) instead of entity projections. Each service exposes one function that accepts filter parameters and returns an `array of <type>`.

## Consequences

- The API contract is explicit: consumers see callable functions, not entity sets that might appear writable.
- No need for `@readonly`, `@restrict`, or reject handlers for write operations.
- Fiori Elements list reports require slightly more configuration to bind to function imports instead of entity sets.
- Standard OData query options (`$filter`, `$orderby`, `$top`/`$skip`) are not available on function imports; filtering is handled via function parameters.
