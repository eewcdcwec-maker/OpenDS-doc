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
| `scripts/two-host-identity-e2e.mjs` | An organization with its own wallet and connectors on a second host ([below](#two-host-integration-test))                                                                                                                                             |

CI runs `npm run check`, dependency audits, fresh database migrations, the API smoke test and
the browser workflows on every pull request. Run the real connector tests on a deployment
before changing exchange, policy, provisioning, identity, self-hosting or source login
behavior.

Notes for the integration tests:

- `runtime-e2e` runs three platform-hosted connectors at once, so the server needs about 6 CPU
  cores and 12 GB RAM, and on a 4-core server it stops when the third connector cannot start.
- They run on the host and need Node.js 22 or newer there. `manage.sh` trusts the dataspace
  CA for them, and for direct `node scripts/...` runs set `NODE_EXTRA_CA_CERTS` to
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
  `OPENDS_RUNTIME_E2E_SOURCE_PORT=<port>` and `OPENDS_RUNTIME_E2E_SOURCE_LOGIN_ALLOWED=1`,
  otherwise that scenario is skipped.
- The cloud storage scenario of the runtime test runs when an AWS or Azure Blob emulator
  reachable from the connectors and the platform is given: LocalStack 4.3 or newer with
  `SERVICES=s3,iam,sts` (`OPENDS_RUNTIME_E2E_S3_ENDPOINT=http://<docker gateway>:4566`, because older
  versions refuse the connector's multipart upload, and only the API accepts an S3 endpoint,
  not the app), or Azurite
  (`OPENDS_RUNTIME_E2E_AZURE_ENDPOINT=http://<docker gateway>:10000/%s`). Start the platform
  with the emulator origins in `CLOUD_STORAGE_ENDPOINTS`, or saving the settings is refused.
  Keys are set with `OPENDS_RUNTIME_E2E_S3_KEY_ID`, `_S3_SECRET`, `_AZURE_ACCOUNT` and
  `_AZURE_KEY`, and the emulators' defaults are used otherwise. The self-host test runs its cloud
  scenario (keys stored with `cloud-storage.sh`, an agent-signed upload, S3 pushes in both
  directions) with `OPENDS_SELF_HOST_E2E_S3_ENDPOINT` set the same way. Against real AWS and
  Azure instead, set `OPENDS_SELF_HOST_E2E_S3_BUCKET` (an existing bucket), `_S3_REGION`,
  `_S3_KEY_ID` and `_S3_SECRET`, and optionally `_AZURE_ACCOUNT`, `_AZURE_KEY` and
  `_AZURE_CONTAINER` (an existing container), and test files stay under `opends-tests/`.
- The two-host test needs a second Docker host reachable over SSH (`OPENDS_TWO_HOST_SSH`,
  `OPENDS_TWO_HOST_HOST`), and `OPENDS_TWO_HOST_KEEP=1` keeps its organizations and containers
  for inspection.
- `PAYLOAD_PROOF_PRODUCTION=1 npm run test:platform` starts an isolated production API
  (port 8082 by default) against a disposable database and checks API isolation, sessions,
  restarts, duplicate jobs and admin routing. Do not run another worker against that
  database.
- Keep database URLs and installer tokens out of logs and source archives.

## Two-host integration test

`scripts/two-host-identity-e2e.mjs` checks that an organization on another server can join an
OpenDS dataspace and exchange data with an organization OpenDS hosts. It covers the production
issuer, administrator approval, HTTPS `did:web` resolution, the BDRS directory and DSP between
independent hosts.

|              | OpenDS server                    | Second server                                               |
| ------------ | -------------------------------- | ----------------------------------------------------------- |
| Organization | "Org A", managed identity        | "Org B"                                                     |
| Wallet       | OpenDS IdentityHub               | Hosted by OpenDS, or its own (`OPENDS_TWO_HOST_WALLET=own`) |
| Connectors   | Hosted by OpenDS                 | Two self-hosted connectors behind one shared HTTPS entry    |
| Credentials  | OpenDS production issuer         | OpenDS production issuer                                    |

The test registers and approves both organizations, exchanges data in both directions,
offboards Org B, and removes the resources it created on the second server.

### Requirements

- OpenDS installed with `PUBLIC_DOMAIN`, so that the production issuer exists.
- A second Linux server with Docker, reachable over SSH from the OpenDS server, with inbound
  TCP port 443.
- For `OPENDS_TWO_HOST_WALLET=own`, an issuer that can reach the organization's wallet. Allow
  a private second server with `ORGANIZATION_PRIVATE_NETWORKS`
  ([Configuration](/administration/configuration#private-networks)), while a separate identity host
  cannot reach a private wallet.

### Run the test

```bash
OPENDS_TWO_HOST_SSH=user@second-server OPENDS_TWO_HOST_HOST=<second-server-ip> \
  NODE_EXTRA_CA_CERTS=.deploy/ca/dataspace-ca.crt node scripts/two-host-identity-e2e.mjs
```

Set `OPENDS_TWO_HOST_KEEP=1` to keep organizations and containers for inspection. With an own
wallet, `OPENDS_TWO_HOST_SWITCH=1` also moves Org B's wallet to OpenDS and back. That switch is
refused while Org B's self-hosted connectors are online.

The test uses `sslip.io` names built from the second server's IP address. To use a stable wallet
hostname instead, set `OPENDS_TWO_HOST_WALLET_DOMAIN=wallet.example.org` and point its A record
at the second server.

For a manual setup, use [Self-hosted wallet](/self-hosting/self-hosted-wallet) and create
a self-hosted connector from the app.
