# ADR-004: Mock external services via cds.connect.to spy

## Status

Accepted

## Context

Tests need to verify service behavior without calling real S/4 HANA endpoints. CAP provides `cds.test()` to boot the server in-process, but there is no built-in mechanism to intercept external service connections with fixture data.

The external OData services use service names with underscores (`API_SLSPRICINGCONDITIONRECORD_SRV`, `YY1_RSM_WORKAGRMNT_VAL_IE_CDS`, etc.), which also complicates mock file–based approaches that rely on filesystem naming conventions. The application now integrates five external services, making a consistent mock strategy even more important.

## Decision

Use **`jest.spyOn(cds.connect, 'to')`** to intercept `cds.connect.to()` calls before the server boots. The spy returns hand-crafted mock service objects with:

- An `entities` map matching the entity names the library modules destructure.
- A `run` method (Jest mock function) that evaluates CDS queries against in-memory fixture arrays.
- A `send` method (Jest mock function) for services that require raw HTTP calls (e.g., `YY1_TT_PERSONWORKAGREEMENT_CDS` uses a parameterized OData V2 entity path via `srv.send('GET', path)`).

A shared **`matchesWhere(record, where)`** helper interprets the CDS WHERE clause structure, supporting equality checks (`=`) and set membership (`in`) over `and`-chained conjunctions.

The five mocked services and the test files that mock them:

| Service | Mocked in |
|---|---|
| `API_SLSPRICINGCONDITIONRECORD_SRV` | all integration test files |
| `YY1_RSM_WORKAGRMNT_VAL_IE_CDS` | all integration test files |
| `YY1_TT_PERSONWORKAGREEMENT_CDS` | `employee-service.test.js`, `sales-condition-ui.test.js` |
| `SC_EXTERNAL_SERVICES_SRV` | `employee-service.test.js` |
| `API_BUSINESS_PARTNER` | `employee-service.test.js` |

## Consequences

- Tests are fully deterministic and run offline — no network calls, no test tenant required.
- The `matchesWhere` helper supports flat conjunctions of equality and `in` checks, which covers all current query patterns. More complex queries (e.g., `or`, nested expressions) would require extending it.
- Mock setup is duplicated across test files that need different fixture data. This is acceptable given the small number of test files and keeps each test self-contained.
- Library module tests (`condition-record.test.js`, `worker-mapping.test.js`) mock only `cds.connect.to`, while integration tests (`employee-service.test.js`, `sales-condition-ui.test.js`) mock all relevant services and boot the full server via `cds.test()`.
