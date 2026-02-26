# ADR-003: Credentials via .cdsrc-private.json

## Status

Accepted

## Context

During local development, the application needs credentials (URL, username, password) for five external OData services:

- `API_SLSPRICINGCONDITIONRECORD_SRV` — condition records
- `YY1_RSM_WORKAGRMNT_VAL_IE_CDS` — worker ↔ work agreement mapping
- `YY1_TT_PERSONWORKAGREEMENT_CDS` — employee name and cost center
- `SC_EXTERNAL_SERVICES_SRV` — project → customer mapping
- `API_BUSINESS_PARTNER` — customer name and Mandantengruppe

The conventional CAP approach uses environment variables with the pattern `cds_requires_<service>_credentials_<key>`, but CDS parses underscores as nested-key separators. This breaks for service names like `API_SLSPRICINGCONDITIONRECORD_SRV` and `YY1_RSM_WORKAGRMNT_VAL_IE_CDS` — CDS interprets `API`, `SLSPRICINGCONDITIONRECORD`, and `SRV` as separate nesting levels instead of a single service name.

The `--profile hybrid` flag was previously used with `.env`, but the underscore ambiguity made this approach unreliable.

## Decision

Store local development credentials in **`.cdsrc-private.json`** in the project root. This file uses JSON, where service names are unambiguous object keys. CDS merges it with the project configuration automatically — no profile flag is needed.

The file is listed in `.gitignore` to prevent credential leakage.

## Consequences

- Service names with underscores work correctly because JSON keys are not subject to separator parsing.
- `cds watch` works without `--profile hybrid`; credentials are picked up automatically.
- Developers must create `.cdsrc-private.json` manually (documented in README and `.env.example`).
- The `.env` file is no longer used for S/4 credentials but can still hold Cloud Foundry deployment variables.
