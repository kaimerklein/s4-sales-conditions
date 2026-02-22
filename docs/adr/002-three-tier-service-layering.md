# ADR-002: Three-tier service layering

## Status

Accepted

## Context

The application needs to orchestrate calls across two external OData services and apply business logic (e.g., worker-to-agreement resolution, deduplication, filtering by condition type). Putting all logic into CDS service handlers would create large, hard-to-test handler files.

## Decision

Organize server-side code into three tiers:

1. **Service handlers** (`srv/*.js`) — Thin orchestration layer. Registers CDS event handlers, validates input, calls library functions, and maps errors to HTTP status codes.
2. **Library modules** (`srv/lib/*.js`) — Business logic. Each module owns interaction with one external service. Functions are pure-ish (depend on `cds.connect.to` but have no CDS request context). Independently testable.
3. **External services** (`srv/external/`) — CDS-imported OData service definitions and metadata. Consumed via `cds.connect.to()`.

## Consequences

- Library modules can be unit-tested by mocking only `cds.connect.to`, without booting the full CAP server.
- Service handlers stay small and focused on HTTP/OData concerns.
- Adding a new external service means adding a library module and wiring it into the relevant handler — no changes to the layering itself.
- The extra indirection adds a small amount of boilerplate compared to inline handler logic.
