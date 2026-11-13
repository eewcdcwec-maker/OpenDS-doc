# Development

How to propose a change is in `CONTRIBUTING.md`; this page covers
running OpenDS from source and testing it.

## Running locally

Use Node.js 22.23.4 (pinned in `.nvmrc`, the package engines, CI and the Dockerfiles). A
Docker deployment itself needs no Node.js on the host.

```bash
npm run bootstrap        # install all dependencies
npm run check            # format, lint, types, unit tests and builds
npm run dev:frontend     # app on port 5173
```

The frontend development server forwards API and admin routes to port 8080. Set
`API_PROXY_TARGET` for another API address. The proxy keeps an explicit Origin and otherwise
forwards the Referer origin, so Payload's cookie and CSRF checks also work over plain HTTP.

To run the backend from source as well, after `bash manage.sh setup` has created `.env`:

```bash
npm run dev:backend      # API on port 8080, using the settings in .env
npm run dev:worker       # jobs: connector provisioning, identity, health
API_PROXY_TARGET=http://localhost:8080 npm run dev:frontend
```

Run the API and the worker in separate terminals with the same settings and cluster access.
Backend resource operations use the official Kubernetes client; kubectl is only used by
infrastructure scripts and tests. Rendering tests need Helm on `PATH`, in `.tools/helm`
(installed by setup), or set through `HELM_BIN`.

For a database of your own, use a fresh PostgreSQL 18 and set `PAYLOAD_DATABASE_URL`,
`PAYLOAD_SECRET` and `OPENDS_DATA_KEY` (each 32 characters or more), `PAYLOAD_ADMIN_EMAIL`, `PAYLOAD_ADMIN_PASSWORD`
(16 characters or more), `PAYLOAD_SERVER_URL` and `CORS_ORIGIN` (the browser origin), and
`PLATFORM_PUBLIC_URL` (an address self-hosted agents can reach). Then:

```bash
npm --prefix backend run platform:migrate
npm --prefix backend run seed    # creates the administrator; never overwrites accounts
```

## Database changes

Schema changes need checked-in migrations; schema push is not a deployment strategy.

```bash
npm --prefix backend run platform:migration:create -- describe_change
npm --prefix backend run platform:migrate
npm --prefix backend run platform:types
```

For these commands on the host, set `PAYLOAD_DATABASE_URL` to the local PostgreSQL in your
shell; containers and CI set it themselves. `platform:types` regenerates the checked-in API
types for both backend and frontend.

## Tests

| Command                             | What it covers                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                     | Formatting, shell syntax, lint, strict TypeScript, unit tests and builds                                                                                                                                                                                                 |
| `npm run test:e2e`                  | Browser workflows (Playwright, `frontend/e2e/`)                                                                                                                                                                                                                          |
| `bash manage.sh smoke`              | API: organizations, accounts, permissions, planned connectors, discovery, approvals, contract documents                                                                                                                                                                  |
| `bash manage.sh runtime-e2e`        | Real connectors: provisioning, policies, approvals, HTTP and file sources, source credentials, cloud storage, token renewal, discovery, organization isolation, exchanges, partner group changes on published offers, agreement revocation and provider-side termination |
| `bash manage.sh self-host-e2e`      | A self-hosted connector on the same host: both exchange directions, local source credentials, STS rotation, stop and resume, reinstall                                                                                                                                   |
| `scripts/two-host-identity-e2e.mjs` | An organization with its own wallet and connectors on a second host ([two-host integration test](/development/two-host-test))                                                                                                                                             |

CI runs `npm run check`, dependency audits, fresh database migrations, the API smoke test and
the browser workflows on every pull request. Run the real connector tests on a deployment
before changing exchange, policy, provisioning, identity, self-hosting or source login
behavior.

Notes for the integration tests:

- `runtime-e2e` runs three platform-hosted connectors at once, so the server needs about 6 CPU
  cores and 12 GB RAM; on a 4-core server it stops when the third connector cannot start.
- They run on the host and need Node.js 22 or newer there. `manage.sh` trusts the dataspace
  CA for them; for direct `node scripts/...` runs set `NODE_EXTRA_CA_CERTS` to
  `.deploy/ca/dataspace-ca.crt`.
- They create their own organizations and offboard them afterwards.
  `bash manage.sh clean-test-data` removes leftovers of interrupted runs.
- Overrides include `OPENDS_BASE_URL`, `PLAYWRIGHT_BASE_URL` (with
  `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=1` for an installation with its own CA), `OPENDS_ADMIN_EMAIL` and
  `OPENDS_ADMIN_PASSWORD`. The self-host test also accepts `OPENDS_SELF_HOST_E2E_*` network
  and port overrides (for example connector port 28080 and agent port 27070), and
  `OPENDS_SELF_HOST_E2E_DATABASE_URL` for an isolated test database.
- The token renewal scenario of the runtime test serves a login source from the test host,
  which the platform refuses as a private address unless allowed. Start the backend with
  `SOURCE_LOGIN_PRIVATE_ORIGINS=http://<docker gateway>:<port>` and run the test with
  `OPENDS_RUNTIME_E2E_SOURCE_PORT=<port>` and `OPENDS_RUNTIME_E2E_SOURCE_LOGIN_ALLOWED=1`;
  otherwise that scenario is skipped.
- The cloud storage scenario of the runtime test runs when an AWS or Azure Blob emulator
  reachable from the connectors and the platform is given: LocalStack 4.3 or newer with
  `SERVICES=s3,iam,sts` (`OPENDS_RUNTIME_E2E_S3_ENDPOINT=http://<docker gateway>:4566`; older
  versions refuse the connector's multipart upload, and only the API accepts an S3 endpoint,
  the app does not offer one), or Azurite
  (`OPENDS_RUNTIME_E2E_AZURE_ENDPOINT=http://<docker gateway>:10000/%s`). Start the platform
  with the emulator origins in `CLOUD_STORAGE_ENDPOINTS`, or saving the settings is refused.
  Keys are set with `OPENDS_RUNTIME_E2E_S3_KEY_ID`, `_S3_SECRET`, `_AZURE_ACCOUNT` and
  `_AZURE_KEY`; the emulators' defaults are used otherwise. The self-host test runs its cloud
  scenario (keys stored with `cloud-storage.sh`, an agent-signed upload, S3 pushes in both
  directions) with `OPENDS_SELF_HOST_E2E_S3_ENDPOINT` set the same way. Against real AWS and
  Azure instead, set `OPENDS_SELF_HOST_E2E_S3_BUCKET` (an existing bucket), `_S3_REGION`,
  `_S3_KEY_ID` and `_S3_SECRET`, and optionally `_AZURE_ACCOUNT`, `_AZURE_KEY` and
  `_AZURE_CONTAINER` (an existing container); test files stay under `opends-tests/`.
- The two-host test needs a second Docker host reachable over SSH (`OPENDS_TWO_HOST_SSH`,
  `OPENDS_TWO_HOST_HOST`); `OPENDS_TWO_HOST_KEEP=1` keeps its organizations and containers
  for inspection.
- `PAYLOAD_PROOF_PRODUCTION=1 npm run test:platform` starts an isolated production API
  (port 8082 by default) against a disposable database and checks API isolation, sessions,
  restarts, duplicate jobs and admin routing. Do not run another worker against that
  database.
- Keep database URLs and installer tokens out of logs and source archives.

## Dependencies

The dependency gate is `npm audit --audit-level=high` in all three packages. Overrides for
DOMPurify and graphql-scalars address high advisories in upstream packages; remaining low and
moderate upstream advisories are reported by the audit, not hidden.

## Runtime upgrades

A Tractus-X release is an explicit dependency upgrade, not an automatic image change. The
platform and connector databases use PostgreSQL 18.

1. Review the release notes: database migrations, Management API, DSP, identity, policy and
   configuration changes.
2. Add the matching chart under `runtimes/tractusx/charts`. Update its checksum, version,
   images and endpoints in the profile, and `infra/charts/SHA256SUMS`. Adapt the Tractus-X
   integration where the upstream contract changed.
3. Update the platform schema and defaults where needed.
4. Run `npm run check`, the smoke test, real connector exchanges and the self-host test in an
   isolated deployment, with the same candidate images for both hosting modes
   ([Development](/development#tests)).
5. Reprovision connectors and regenerate self-host bundles. Updating the backend does not
   upgrade running connectors or bundles organizations already downloaded.

`bash manage.sh runtime-e2e` also watches BDRS traffic through a temporary forwarding proxy,
keeping only method, path and status. The exchange flows use the BDRS directory, so it stays
enabled. The profile tests check that chart dependencies and images agree, and reject
versions OpenDS does not implement.
