---
title: Testing
---

# Testing

The following commands cover the main levels of testing in OpenDS:

| Command                             | What it covers                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                     | Formatting, shell syntax, lint, strict TypeScript, unit tests and builds                                                                                                                                                                                                 |
| `npm run test:e2e`                  | Browser workflows (Playwright, `frontend/e2e/`)                                                                                                                                                                                                                          |
| `bash manage.sh smoke`              | API: organizations, accounts, permissions, planned connectors, discovery, approvals, contract documents                                                                                                                                                                  |
| `bash manage.sh runtime-e2e`        | Real connectors: provisioning, policies, approvals, HTTP and file sources, source credentials, cloud storage, token renewal, discovery, organization isolation, exchanges, partner group changes on published offers, agreement revocation and provider-side termination |
| `bash manage.sh self-host-e2e`      | A self-hosted connector on the same host: both exchange directions, local source credentials, STS rotation, stop and resume, reinstall                                                                                                                                   |
| `scripts/two-host-identity-e2e.mjs` | An organization on a second server joins the dataspace and exchanges data with an organization hosted by OpenDS                                                                                                                                                          |

CI runs `npm run check`, dependency audits, fresh database migrations, the API smoke test and
the browser workflows on every pull request. Run the real connector tests on a deployment
before changing exchange, policy, provisioning, identity, self-hosting or source login
behavior.

## Integration test requirements

- **Runtime test capacity**: `runtime-e2e` runs three platform-hosted connectors at once, so
  the server needs about 6 CPU cores and 12 GB RAM. On a 4-core server, the test stops when the
  third connector cannot start.
- **Host environment and certificates**: the integration tests run on the host and need
  Node.js 22 or newer there. `manage.sh` trusts the dataspace CA for them. For direct
  `node scripts/...` runs, set `NODE_EXTRA_CA_CERTS` to `.deploy/ca/dataspace-ca.crt`.
- **Test data**: the tests create their own organizations and offboard them afterwards. Run
  `bash manage.sh clean-test-data` to remove leftovers of interrupted runs.
- **Configuration overrides**:
  - The integration scripts accept `OPENDS_BASE_URL`, `OPENDS_ADMIN_EMAIL` and
    `OPENDS_ADMIN_PASSWORD`.
  - The browser workflows use `PLAYWRIGHT_BASE_URL`. For an installation with its own CA, set
    `PLAYWRIGHT_IGNORE_HTTPS_ERRORS=1`. They sign in with `PAYLOAD_ADMIN_EMAIL` and
    `PAYLOAD_ADMIN_PASSWORD`.
  - The self-host test accepts `OPENDS_SELF_HOST_E2E_*` network and port overrides, for example
    connector port 28080 and agent port 27070. It also accepts
    `OPENDS_SELF_HOST_E2E_DATABASE_URL` for an isolated test database.

## Remote connector cluster

With a remote connector cluster, the connectors must be able to reach the test host.

- **Runtime test**: set `OPENDS_RUNTIME_E2E_SOURCE_HOST` to the OpenDS server's private
  address. Otherwise, the test uses the local kind network, and the first transfer fails with
  "No BPN entry found for agreement".
- **Self-host test**: the test can place its connector on a second server with
  `OPENDS_SELF_HOST_E2E_SSH=<user@server>`, together with `OPENDS_SELF_HOST_E2E_PUBLIC_HOST`
  and `OPENDS_SELF_HOST_E2E_DATASPACE_EDGE_IP`, both set to that server's address. If its
  port 443 is already in use, also set `OPENDS_SELF_HOST_E2E_EDGE=shared`.

## Source login scenario

The token renewal scenario of the runtime test serves a login source from the test host. The
platform refuses the source as a private address unless its origin is allowed.

Start the backend with the origin allowed:

```bash
SOURCE_LOGIN_PRIVATE_ORIGINS=http://<docker gateway>:<port>
```

Then run the test with the same port:

```bash
OPENDS_RUNTIME_E2E_SOURCE_PORT=<port> \
OPENDS_RUNTIME_E2E_SOURCE_LOGIN_ALLOWED=1 \
  bash manage.sh runtime-e2e
```

Otherwise, the token renewal scenario is skipped.

## Cloud storage scenarios

The cloud storage scenario of the runtime test runs when an AWS or Azure Blob emulator is
given that both the connectors and the platform can reach:

- **LocalStack**: version 4.3 or newer with `SERVICES=s3,iam,sts`. Set
  `OPENDS_RUNTIME_E2E_S3_ENDPOINT=http://<docker gateway>:4566`. Older versions refuse the
  connector's multipart upload. Only the API accepts an S3 endpoint, not the app.
- **Azurite**: set `OPENDS_RUNTIME_E2E_AZURE_ENDPOINT=http://<docker gateway>:10000/%s`.

Start the platform with the emulator origins in `CLOUD_STORAGE_ENDPOINTS`. Otherwise, saving
the settings is refused.

Set the emulator keys with these variables, or the emulators' defaults are used:

- `OPENDS_RUNTIME_E2E_S3_KEY_ID`
- `OPENDS_RUNTIME_E2E_S3_SECRET`
- `OPENDS_RUNTIME_E2E_AZURE_ACCOUNT`
- `OPENDS_RUNTIME_E2E_AZURE_KEY`

The self-host test runs its own cloud storage scenario. It covers keys stored with
`cloud-storage.sh`, an agent-signed upload and S3 pushes in both directions. Set
`OPENDS_SELF_HOST_E2E_S3_ENDPOINT` the same way to point it at an emulator.

To test against real AWS and Azure instead, set:

- `OPENDS_SELF_HOST_E2E_S3_BUCKET` (an existing bucket)
- `OPENDS_SELF_HOST_E2E_S3_REGION`
- `OPENDS_SELF_HOST_E2E_S3_KEY_ID`
- `OPENDS_SELF_HOST_E2E_S3_SECRET`
- Optionally `OPENDS_SELF_HOST_E2E_AZURE_ACCOUNT`, `OPENDS_SELF_HOST_E2E_AZURE_KEY` and
  `OPENDS_SELF_HOST_E2E_AZURE_CONTAINER` (an existing container)

With real storage, the test files are created under `opends-tests/<run>/` in the bucket or
container and are not deleted.

## Two-host identity test

The two-host test needs OpenDS installed with `PUBLIC_DOMAIN`, and a second Linux server with
Docker, reachable over SSH from the OpenDS server and accepting inbound TCP connections on port
443. Run it with:

```bash
OPENDS_TWO_HOST_SSH=user@second-server OPENDS_TWO_HOST_HOST=<second-server-ip> \
  node scripts/two-host-identity-e2e.mjs
```

Set `OPENDS_TWO_HOST_KEEP=1` to keep the test organizations and containers for inspection.

Further options:

- **`OPENDS_TWO_HOST_WALLET=own`**: the second organization uses a self-hosted identity instead
  of a managed identity. The issuer must be able to reach its wallet. On a private network,
  allow the second server with `ORGANIZATION_PRIVATE_NETWORKS`
  ([Configuration](/administration/configuration#private-networks)).
- **`OPENDS_TWO_HOST_SWITCH=1`**: together with `own`, the test also switches the organization
  to a managed identity and back. The switch is refused while that organization's self-hosted
  connectors are online.
- **`OPENDS_TWO_HOST_WALLET_DOMAIN=wallet.example.org`**: uses a stable wallet hostname instead
  of an `sslip.io` name. Point its A record to the second server.

## Production API proof test

Run the following command to start an isolated production API, on port 8082 by default, with a
disposable database:

```bash
PAYLOAD_PROOF_PRODUCTION=1 npm run test:platform
```

The test checks API isolation, sessions, restarts, duplicate jobs and admin routing. Do not
run another worker against that database.

Keep database URLs and installer tokens out of logs and source archives.
