# About this Project

This project provides a side-by-side extension to SAP S/4 HANA Cloud, Public Cloud Edition (CloudERP). It offers a user-friendly way to maintain sales price condition records in SAP, which are required for billing of work hours towards customers. These sales prices refer to working hours of employees and other criteria, like customer, customer group, or project ID.

# Requirements and Features

## Overview

The application provides a list report that displays sales price condition records (condition type PCP0) from SAP S/4 HANA Cloud. Users can filter by worker ID (personal number) and/or customer number. Since condition records reference work agreement IDs rather than worker IDs, a mapping service resolves this translation.

## Feature 1: Worker ID to Work Agreement ID Mapping Service

**Context:** Condition records in S/4 HANA do not contain the worker/employee ID (personal number). Instead, they reference a work agreement ID. A custom OData API will eventually provide this mapping. Until that API is available, a mock implementation is used.

**Acceptance Criteria:**
- A local CAP service exposes an operation that accepts a worker ID and returns the corresponding work agreement ID and its validity start date
- The implementation is a mock that returns plausible test data
- The mock is clearly marked and isolated in `/srv/lib/` so it can be replaced by a real remote service call later without changing the consuming code
- The interface (function signature / CDS action) matches what the future real OData API will provide
- Automated tests verify the mock returns expected results for known test inputs and handles unknown worker IDs gracefully

## Feature 2: S/4 HANA Condition Record OData Service Integration

**Context:** Sales price condition records of type PCP0 must be retrieved from SAP S/4 HANA Cloud via an external OData service.

**Acceptance Criteria:**
- The external OData service definition is imported into `/srv/external`
- A CAP remote service is configured in `package.json` under `cds.requires`
- A reusable module in `/srv/lib/` wraps the remote service call and filters condition records by condition type PCP0
- The module accepts optional filter parameters: work agreement ID and customer number
- At least one filter parameter must be provided; the module rejects requests with no filters
- Automated tests use mocked remote service responses and verify correct filtering, parameter validation, and error handling

## Feature 3: Filter Bar with Worker ID and Customer Number

**Context:** The user needs to provide at least one filter criterion to search for condition records.

**Acceptance Criteria:**
- The CDS service exposes filter fields for worker ID (personal number) and customer number
- At least one of the two filters must be provided; the service rejects requests where both are empty with a meaningful error message
- When a worker ID is provided, Feature 1 is invoked to resolve it to a work agreement ID before querying condition records
- When only a customer number is provided, condition records are queried directly by customer number
- When both are provided, both filters are applied
- Automated tests cover all filter combinations: worker ID only, customer number only, both provided, neither provided (error case)

## Feature 4: List Report — Data Composition and Projection

**Context:** The list report aggregates data from multiple sources (condition records, worker mapping) into a single flat result set for display.

**Acceptance Criteria:**
- A CDS service definition models the list report projection with all fields relevant for display (to be refined as requirements evolve, but at minimum: work agreement ID, worker ID, customer number, condition rate/amount, validity dates, currency)
- The service handler orchestrates calls to Feature 1 and Feature 2, composing the result
- Results are returned as a flat list suitable for a UI table
- Automated tests verify correct composition from mocked underlying services, including scenarios where the worker mapping returns no result

## Feature 5: List Report — UI Annotation and Frontend

**Context:** The list report is presented to the user as a Fiori Elements List Report page.

**Acceptance Criteria:**
- CDS UI annotations define the list report layout, column order, labels, and filter bar fields
- The application can be launched locally via `cds watch` and the list report is accessible
- Filter fields for worker ID and customer number are rendered in the filter bar
- The results table displays all projected fields with meaningful column headers
- Automated tests verify that the CDS model compiles correctly and that annotations are present

## Implementation Order

Implement features strictly in the order listed above (1 → 2 → 3 → 4 → 5). Each feature builds on the previous one. For every feature, write and verify automated tests before moving to the next feature.

# Project Structure

- `/db` - CDS data model and schema definitions
- `/srv` - CDS service definitions and handlers
- `/srv/lib` - Reusable business logic modules
- `/srv/external` - Imported external OData service definitions (.edmx / .csn)
- `/app` - UI applications (if any)
- `/test` - Jest test suites
- `/docs/adr` - Architecture Decision Records
- `/mta.yaml` - MTA deployment descriptor
- `/package.json` - Node.js dependencies and CDS configuration

# Guardrails

- Framework: SAP CAP (Cloud Application Programming Model) using @sap/cds ^8
- Runtime: Node.js 24.x
- Deployment: SAP BTP Cloud Foundry via MTA (`mbt build`)
- Production DB: SAP HANA Cloud
- Development DB: SQLite (via cds-dk)
- Authentication: SAP BTP XSUAA

# Development Guidelines

## Naming Conventions

- Variables and functions: camelCase (`salesPrice`, `getConditionRecords`)
- CDS entities: PascalCase (`SalesPriceConditions`)
- CDS fields: camelCase following SAP style guides
- Files: lowercase, hyphen-separated, pure ASCII, safe on any platform (`sales-price-service.js`, not `SalesPriceService.js`)
- Test files: `<module>.test.js` located in `/test`

## Code Organization

- Each CDS service file addresses one bounded context (e.g., sales pricing, customer master)
- Handler files correspond 1:1 to service definitions (`sales-price-service.js` handles `SalesPriceService.cds`)
- Extract reusable business logic into `/srv/lib/` modules — handlers orchestrate, they do not contain complex logic
- Keep CDS model definitions (`/db`) free of behavioral logic; behavior belongs in handlers

## Design Philosophy

- Do not build abstractions speculatively — introduce them when a second or third use case demands it (YAGNI)
- Prefer simple, direct implementations over clever ones
- When in doubt, write the straightforward solution first; refactor only when duplication or complexity warrants it

## Code Quality

- Leave code cleaner than you found it — when touching a file, improve small issues (naming, unused imports, outdated comments)
- Dead code is deleted, not commented out (version control preserves history)
- Comments explain *why*, not *what* — the code itself should be readable enough to explain what it does
- Functions should do one thing and be short enough to understand at a glance

## Input Validation

- Validate all external input at the service boundary (before-handlers)
- Never trust client-provided data; enforce type, range, and business rule checks in code even if CDS annotations exist
- Use early returns / `req.reject()` for invalid input rather than deeply nested conditionals
- Sanitize any values used in dynamic queries or log output

## Error Handling & Observability

- Fail fast: detect and surface problems at the earliest possible point
- Distinguish between expected business errors (user-facing, via `req.error()`) and unexpected system errors (logged, re-thrown)
- Never catch exceptions without logging or re-throwing them
- Use `cds.log()` namespaced per module, e.g., `const LOG = cds.log('sales-price')`
- Structure log messages for searchability: include entity, operation, and relevant IDs, e.g., `LOG.info('Price condition created', { conditionId, customerId })`
- Log towards console only using CAP logging (`cds.log`)

## Remote Services

- Import OData service definitions as `.edmx` or `.csn` into `/srv/external`
- Access remote services via `cds.connect.to('RemoteServiceName')` — never use raw HTTP calls
- Define external service bindings in `package.json` under `cds.requires`

## Authentication & Authorization

- Use `@requires` and `@restrict` annotations in CDS for authorization
- XSUAA service instance bound via MTA
- No hardcoded credentials anywhere; use destination service or environment bindings

## Configuration

- All environment-specific configuration via environment variables or SAP BTP service bindings
- No environment-specific values (URLs, credentials, feature flags) hardcoded in source
- Use `cds.env` and `package.json` `cds.requires` for CAP-specific configuration
- Maintain a `.env.example` (without real values) documenting required environment variables

## Dependency Management

- Pin dependency versions in `package.json` (exact versions, not ranges) for reproducible builds
- Audit dependencies periodically: `npm audit`
- Avoid dependencies for trivial functionality (e.g., do not add a library for simple string manipulation)
- Before adding any npm dependency, explain why it is needed and confirm it is not already covered by CAP
- Document every non-CAP dependency in `README.md` with its purpose

## API / Service Design

- Design CDS services contract-first: define the service interface and entities before implementing handlers
- Keep service APIs stable; use versioning or deprecation rather than breaking changes
- Expose only what consumers need — use projections in CDS to limit exposed fields and associations
- Follow RESTful / OData conventions; avoid custom actions/functions when standard CRUD operations suffice

# Testing

- We follow the concept of test-driven development (TDD)
- Framework: Jest
- All service handlers must have corresponding unit tests
- Use `cds.test()` for in-process testing with SQLite
- Mock external/remote services; never call live endpoints in tests
- All code is modularized with easy testing in mind; modularization allows simple yet effective mocking
- Test file naming: `<feature>.test.js`
- Minimum test scope: service handlers, custom logic modules, input validation
- Run tests: `npx jest` or `npm test`
- CAP hybrid testing is used for integration verification

# Version Control

- Commits are atomic: one logical change per commit
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Never commit secrets, `.env` files, or `node_modules`
- Maintain a meaningful `.gitignore` from project start

# Definition of Done

A feature is considered complete when:

1. CDS model and service definition are in place
2. Handler logic is implemented and follows project conventions
3. Input validation exists at the service boundary
4. Unit tests pass and cover the main paths and key edge cases
5. `cds.log` statements are present for meaningful operations
6. No new linting warnings are introduced
7. `README.md` is updated if dependencies or setup steps changed

# Workflow Preferences

- When creating new features, always start with the CDS model/service definition before writing handler code
- When generating code, include the corresponding test file in the same response
- Before adding any npm dependency, explain why it is needed and confirm it is not already covered by CAP
- When unsure about a CAP API, refer to https://cap.cloud.sap/docs/

# Documentation Guidelines

The project's `README.md` will be kept up to date. It comprises the following chapters:

- About
- Development
    - Prerequisites
    - Local Execution (Hybrid Testing Mode)
    - Deployment via mbt and cf
- Dependencies
    - External libraries added and reason (libraries not yet included in CAP)
- Architecture Decisions (ADRs)

## ADR Format

Use lightweight ADRs in `/docs/adr/` named `NNN-title.md`:

- **Status:** proposed | accepted | deprecated
- **Context:** why the decision was needed
- **Decision:** what was decided
- **Consequences:** trade-offs and implications