---
title: Testing
---

# Testing

| Command                             | What it covers                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                     | Formatting, shell syntax, lint, strict TypeScript, unit tests and builds                                                                                                                                                                                                 |
| `npm run test:e2e`                  | Browser workflows (Playwright, `frontend/e2e/`)                                                                                                                                                                                                                          |
| `bash manage.sh smoke`              | API: organizations, accounts, permissions, planned connectors, discovery, approvals, contract documents                                                                                                                                                                  |
| `bash manage.sh runtime-e2e`        | Real connectors: provisioning, policies, approvals, HTTP and file sources, source credentials, cloud storage, token renewal, discovery, organization isolation, exchanges, partner group changes on published offers, agreement revocation and provider-side termination |
| `bash manage.sh self-host-e2e`      | A self-hosted connector on the same host: both exchange directions, local source credentials, STS rotation, stop and resume, reinstall                                                                                                                                   |
| `scripts/two-host-identity-e2e.mjs` | An organization on a second server joins the dataspace and exchanges data with an organization OpenDS hosts                                                                                                                                             |

CI runs `npm run check`, dependency audits, fresh database migrations, the API smoke test and
the browser workflows on every pull request. Run the real connector tests on a deployment
before changing exchange, policy, provisioning, identity, self-hosting or source login
behavior.

Notes for the integration tests:

- `runtime-e2e` runs three platform-hosted connectors at once, so the server needs about 6 CPU
  cores and 12 GB RAM. On a 4-core server, it stops when the third connector cannot start.
- They run on the host and need Node.js 22 or newer there. `manage.sh` trusts the dataspace
  CA for them. For direct `node scripts/...` runs, set `NODE_EXTRA_CA_CERTS` to
  `.deploy/ca/dataspace-ca.crt`.
- They create their own organizations and offboard them afterwards.
  `bash manage.sh clean-test-data` removes leftovers of interrupted runs.
- Overrides include `OPENDS_BASE_URL`, `PLAYWRIGHT_BASE_URL` (with
  `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=1` for an installation with its own CA), `OPENDS_ADMIN_EMAIL` and
  `OPENDS_ADMIN_PASSWORD`. The self-host test also accepts `OPENDS_SELF_HOST_E2E_*` network
  and port overrides (for example connector port 28080 and agent port 27070), and
  `OPENDS_SELF_HOST_E2E_DATABASE_URL` for an isolated test database.
- The token renewal scenario of the runtime test serves a login source from the test host.
  The platform refuses it as a private address unless allowed. Start the backend with
  `SOURCE_LOGIN_PRIVATE_ORIGINS=http://<docker gateway>:<port>` and run the test with
  `OPENDS_RUNTIME_E2E_SOURCE_PORT=<port>` and `OPENDS_RUNTIME_E2E_SOURCE_LOGIN_ALLOWED=1`.
  Otherwise, that scenario is skipped.
- The cloud storage scenario of the runtime test runs when an AWS or Azure Blob emulator is
  given that the connectors and the platform can reach:
  - **LocalStack** 4.3 or newer with `SERVICES=s3,iam,sts`
    (`OPENDS_RUNTIME_E2E_S3_ENDPOINT=http://<docker gateway>:4566`). Older versions refuse the
    connector's multipart upload. Only the API accepts an S3 endpoint, not the app.
  - **Azurite** (`OPENDS_RUNTIME_E2E_AZURE_ENDPOINT=http://<docker gateway>:10000/%s`).

  Start the platform with the emulator origins in `CLOUD_STORAGE_ENDPOINTS`, or saving the
  settings is refused. Keys are set with `OPENDS_RUNTIME_E2E_S3_KEY_ID`, `_S3_SECRET`,
  `_AZURE_ACCOUNT` and `_AZURE_KEY`. Otherwise, the emulators' defaults are used.

  The self-host test runs its cloud scenario (keys stored with `cloud-storage.sh`, an
  agent-signed upload, S3 pushes in both directions) with `OPENDS_SELF_HOST_E2E_S3_ENDPOINT` set
  the same way. To test against real AWS and Azure instead, set `OPENDS_SELF_HOST_E2E_S3_BUCKET`
  (an existing bucket), `_S3_REGION`, `_S3_KEY_ID` and `_S3_SECRET`, and optionally
  `_AZURE_ACCOUNT`, `_AZURE_KEY` and `_AZURE_CONTAINER` (an existing container). Test files stay
  under `opends-tests/`.
- The two-host test needs OpenDS installed with `PUBLIC_DOMAIN`, and a second Linux server with
  Docker, reachable over SSH from the OpenDS server and with inbound TCP port 443. Run it with:

  ```bash
  OPENDS_TWO_HOST_SSH=user@second-server OPENDS_TWO_HOST_HOST=<second-server-ip> \
    node scripts/two-host-identity-e2e.mjs
  ```

  `OPENDS_TWO_HOST_KEEP=1` keeps its organizations and containers for inspection.

  - `OPENDS_TWO_HOST_WALLET=own`: the second organization uses a self-hosted identity instead
    of a managed identity. The issuer must be able to reach its wallet. On a private network, allow
    the second server with `ORGANIZATION_PRIVATE_NETWORKS`
    ([Configuration](/administration/configuration#private-networks)).
  - `OPENDS_TWO_HOST_SWITCH=1`: with `own`, the test also switches the organization to a managed
    identity and back.
    The switch is refused while that organization's self-hosted connectors are online.
  - `OPENDS_TWO_HOST_WALLET_DOMAIN=wallet.example.org`: uses a stable wallet hostname instead
    of an `sslip.io` name. Point its A record at the second server.
- `PAYLOAD_PROOF_PRODUCTION=1 npm run test:platform` starts an isolated production API
  (port 8082 by default) against a disposable database and checks API isolation, sessions,
  restarts, duplicate jobs and admin routing. Do not run another worker against that
  database.
- Keep database URLs and installer tokens out of logs and source archives.
