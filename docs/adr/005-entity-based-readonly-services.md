# ADR-005: Entity-based read-only services with custom READ handlers

## Status

Accepted

## Context

The initial design (ADR-001) exposed `SalesConditionService` via CDS functions (`function getConditionRecords(...)`). During Fiori Elements integration, this proved to be a blocking limitation:

- Fiori Elements List Report and Object Page pages require **entity sets**, not function imports, to generate their UI automatically.
- OData query options (`$filter`, `$orderby`, `$top`/`$skip`) are unavailable on function imports; filtering had to be handled entirely through function parameters.
- Navigation properties (e.g., `Employees → Conditions`) require entity associations and composition, which cannot be modelled on function return types.

The service was a pure aggregation layer (no local DB, no writes) and the original reasoning about avoiding unwanted write operations remained valid.

## Decision

Define `SalesConditionService` using **`@readonly entity`** declarations backed by **custom `on('READ', ...)` handlers**. The handler intercepts every read operation, extracts filter values from the incoming CDS WHERE clause AST, orchestrates calls to external library modules, and returns computed result sets.

No local database tables back these entities — they are virtual, computed on every request.

Write operations (`CREATE`, `UPDATE`, `DELETE`) are rejected automatically by CAP because no handlers for them are registered and the entity carries `@readonly`.

`WorkerMappingService` retains the function-based approach (ADR-001) because it is an internal utility consumed programmatically, not by Fiori Elements.

## Consequences

- Fiori Elements List Report, Object Page, and composition navigation work without additional configuration.
- OData query options are available at the protocol level; CAP generates the correct OData metadata.
- The handler must parse the CDS WHERE clause AST manually (`_extractMultiFilters`, `_walkWhere`) because Fiori Elements generates complex nested filter expressions that cannot be mapped to simple function parameters.
- The service is still effectively read-only: CAP rejects unregistered operations automatically.
- No `@readonly`, `@restrict`, or explicit reject handlers are needed for write operations beyond the `@readonly` annotation.
