# s4-sales-conditions

Side-by-side extension to SAP S/4 HANA Cloud (Public Cloud Edition) for maintaining sales price condition records (condition type PCP0). Provides a Fiori Elements list report for filtering and viewing condition records by worker ID or customer number.

## Development

### Prerequisites

- Node.js 24.x
- SAP CAP CLI (`@sap/cds-dk`) installed globally: `npm i -g @sap/cds-dk`
- For deployment: Cloud Foundry CLI with MTA plugin (`cf install-plugin multiapps`)

### Local Execution

```bash
npm ci
cds watch
```

The application starts with an in-memory SQLite database. Open the provided URL to access the service endpoints.

To connect to a real S/4 HANA backend, create a `.cdsrc-private.json` file in the project root (see `.env.example` for the structure). This file is gitignored and provides credentials directly to CDS, avoiding the environment-variable underscore ambiguity that occurs with S/4 service names like `API_SLSPRICINGCONDITIONRECORD_SRV`. No special profile flag is needed — `cds watch` picks up the credentials automatically.

### Running Tests

```bash
npm test
```

Tests use `@cap-js/cds-test` to boot the CAP server and mock external OData services via `cds.connect.to` spies. See [ADR-004](docs/adr/004-mock-external-services-in-tests.md) for details.

### Deployment via mbt and cf

```bash
npm ci
mbt build
cf deploy mta_archives/s4-sales-conditions_1.0.0.mtar
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@sap/cds` | SAP Cloud Application Programming Model runtime |
| `@cap-js/hana` | SAP HANA database driver for CAP |
| `@sap-cloud-sdk/connectivity` | SAP Cloud SDK connectivity layer for destination handling |
| `@sap-cloud-sdk/http-client` | SAP Cloud SDK HTTP client for outbound requests |
| `@sap-cloud-sdk/resilience` | SAP Cloud SDK resilience (retry, circuit breaker) |
| `express` | HTTP server framework (required by CAP) |
| `@cap-js/cds-test` | CAP test utilities (dev only) |
| `@cap-js/sqlite` | SQLite driver for local development (dev only) |
| `jest` | Testing framework (dev only) |

## Architecture Decisions

Architecture Decision Records are maintained in [`docs/adr/`](docs/adr/).

| ADR | Status | Title |
|-----|--------|-------|
| [001](docs/adr/001-function-based-services.md) | Deprecated | Function-based services over entity CRUD |
| [002](docs/adr/002-three-tier-service-layering.md) | Accepted | Three-tier service layering |
| [003](docs/adr/003-credentials-via-cdsrc-private.md) | Accepted | Credentials via .cdsrc-private.json |
| [004](docs/adr/004-mock-external-services-in-tests.md) | Accepted | Mock external services via cds.connect.to spy |
| [005](docs/adr/005-entity-based-readonly-services.md) | Accepted | Entity-based read-only services with custom READ handlers |
| [006](docs/adr/006-employee-centric-hierarchical-data-model.md) | Accepted | Employee-centric hierarchical data model |
| [007](docs/adr/007-two-query-pattern-for-odata-v2-conditions.md) | Accepted | Two-query pattern for OData V2 condition records |
| [008](docs/adr/008-multi-service-enrichment-pipeline.md) | Accepted | Multi-service enrichment pipeline for condition details |
