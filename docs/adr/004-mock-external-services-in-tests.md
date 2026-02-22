# ADR-004: Mock external services via cds.connect.to spy

## Status

Accepted

## Context

Tests need to verify service behavior without calling real S/4 HANA endpoints. CAP provides `cds.test()` to boot the server in-process, but there is no built-in mechanism to intercept external service connections with fixture data.

The external OData services use service names with underscores (`API_SLSPRICINGCONDITIONRECORD_SRV`, `YY1_RSM_WORKAGRMNT_VAL_IE_CDS`), which also complicates mock file–based approaches that rely on filesystem naming conventions.

## Decision

Use **`jest.spyOn(cds.connect, 'to')`** to intercept `cds.connect.to()` calls before the server boots. The spy returns hand-crafted mock service objects with:

- An `entities` map matching the entity names the library modules destructure.
- A `run` method (Jest mock function) that evaluates CDS queries against in-memory fixture arrays.

A shared **`matchesWhere(record, where)`** helper interprets the CDS WHERE clause structure (`[{ref}, '=', {val}, 'and', ...]`) to filter fixture data, enabling realistic query behavior without a real OData backend.

## Consequences

- Tests are fully deterministic and run offline — no network calls, no test tenant required.
- The `matchesWhere` helper supports flat conjunctions (`and`-chained equality checks), which covers all current query patterns. More complex queries (e.g., `or`, `in`, nested expressions) would require extending it.
- Mock setup is duplicated across test files that need different fixture data. This is acceptable given the small number of test files and keeps each test self-contained.
- Library module tests (`condition-record.test.js`, `worker-mapping.test.js`) mock only `cds.connect.to`, while integration tests (`sales-condition.test.js`) mock it and boot the full server via `cds.test()`.
