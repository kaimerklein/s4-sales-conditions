# s4-sales-conditions

Side-by-side extension to SAP S/4 HANA Cloud (Public Cloud Edition) for maintaining sales price condition records (condition type PCP0). Provides a Fiori Elements list report for filtering and viewing condition records by worker ID or customer number.

## Development

### Prerequisites

- Node.js 24.x
- SAP CAP CLI (`@sap/cds-dk`) installed globally: `npm i -g @sap/cds-dk`
- For deployment: Cloud Foundry CLI with MTA plugin (`cf install-plugin multiapps`)

### Local Execution (Hybrid Testing Mode)

```bash
npm ci
cds watch
```

The application starts with an in-memory SQLite database. Open the provided URL to access the service endpoints.

For hybrid testing against a real S/4 HANA backend:

```bash
cp .env.example .env
# Fill in your S/4 HANA credentials in .env
cds watch --profile hybrid
```

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
| `express` | HTTP server framework (required by CAP) |
| `@cap-js/sqlite` | SQLite driver for local development (dev only) |
| `jest` | Testing framework (dev only) |

## Architecture Decisions

Architecture Decision Records are maintained in [`docs/adr/`](docs/adr/).
