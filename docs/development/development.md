---
title: Development
slug: /development/development
---

# Development

This page covers running OpenDS from source. How to propose a change is described in
`CONTRIBUTING.md`, and how to test it under [Testing](/development/testing).

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
Backend resource operations use the official Kubernetes client. kubectl is only used by
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

Schema changes need checked-in migrations, because schema push is not a deployment strategy.

```bash
npm --prefix backend run platform:migration:create -- describe_change
npm --prefix backend run platform:migrate
npm --prefix backend run platform:types
```

For these commands on the host, set `PAYLOAD_DATABASE_URL` to the local PostgreSQL in your
shell. Containers and CI set it themselves. `platform:types` regenerates the checked-in API
types for both backend and frontend.

## Dependencies

The dependency gate is `npm audit --audit-level=high` in all three packages. Overrides for
DOMPurify and graphql-scalars address high advisories in upstream packages. Remaining low and moderate
upstream advisories are reported by the audit, not hidden.

## Runtime upgrades

A new Tractus-X release is never picked up automatically. Moving to it is a deliberate
dependency upgrade:

1. Read the release notes for changes to database migrations, the Management API, DSP,
   identity, policies and configuration.
2. Add the matching chart under `runtimes/tractusx/charts`. In the runtime profile
   (`runtimes/tractusx/profile.json`), update the chart's checksum, version, images and
   endpoints. Also update `infra/charts/SHA256SUMS`. Where the upstream contract changed, adapt
   the Tractus-X integration.
3. Update the platform schema and defaults if needed.
4. In an isolated deployment, run `npm run check`, the smoke test, real connector exchanges and
   the self-host test ([Testing](/development/testing)). Use the same candidate images for
   platform-hosted and self-hosted connectors.
5. Reprovision the connectors and regenerate the self-host bundles. Updating the backend does
   not upgrade running connectors, or bundles that organizations have already downloaded.

Two tests help with an upgrade:

- **Profile tests** check that chart dependencies and images match, and reject versions that
  OpenDS does not implement.
- **`bash manage.sh runtime-e2e`** also records BDRS traffic through a temporary forwarding
  proxy, keeping only method, path and status. The exchange flows use the BDRS directory, so
  it stays enabled.

The platform and connector databases use PostgreSQL 18.

## Internals

- **Worker**: a single runner, guarded by a PostgreSQL advisory lock, so it can safely recover
  jobs a stopped worker left behind. Tasks are serialized per connector, keep their operation
  IDs and recheck the initiating user's permissions.
- **Process rights**: backend and worker run as the user who ran setup (not as root when setup
  is run by a regular user) and without Linux capabilities.
- **Connector Vaults**: an unseal sidecar initializes each Vault, unseals it after restarts and
  creates the connector's own token, derived from `OPENDS_DATA_KEY`. The unseal key is kept on
  the Vault's volume. This protects against restarts but not against access to the volume, so
  production deployments use an external auto-unseal.
- **Single backend instance**: EDR responses of self-hosted connectors pass through backend
  memory and are discarded after delivery. This assumes one backend instance.
- **Participant context**: each connector has a unique, persisted participant-context ID. It
  never changes when a bundle is rendered, a connector restarts, is reprovisioned or switches
  hosting mode.

## Identity services

The test and production identity stacks are two instances of `infra/identity/compose.yaml`,
managed with `./manage.sh identity`. Kubernetes runs connectors only.

| Component               | Version | Role                                                         |
| ----------------------- | ------- | ------------------------------------------------------------ |
| Tractus-X IdentityHub   | 0.4.1   | Wallets, with one participant context per organization       |
| Tractus-X IssuerService | 0.4.1   | The stack's issuer                                           |
| Tractus-X BDRS          | 0.6.0   | The stack's directory, which trusts only the stack's issuer  |
| PostgreSQL 18, Vault 1.20 |       | Persistent stores, with private keys in Vault                |

The issued credentials are MembershipCredential, BpnCredential, DataExchangeGovernanceCredential
and UsagePurposeCredential.

Known limitations of these versions:

- **Issuer DID**: IssuerService 0.4.1 has no DID management API, so OpenDS republishes the
  issuer's DID document. The installer only allows changing the issuer's DID while no holders
  exist.
- **Credential requests**: IdentityHub 0.4.1 cannot delete them, so OpenDS removes them with a
  database role restricted to that table.
- **STS secret**: all connectors of an organization share one STS secret, because IdentityHub
  0.4.1 has one STS account per participant context. OpenDS rotates it by writing the
  IdentityHub Vault entry with a write-only token.
- **Replicas**: each identity service runs as a single replica.

## Repository layout

```text
frontend/
  src/
    app/                 Router, providers, application layout
    theme/               Ant Design theme and global styles
    features/            Pages grouped by business capability
    shared/              Code used by several features, including the API client
  e2e/                   Browser workflow tests
backend/
  src/
    platform/            Collections, permissions, workflows, jobs and migrations
      domain/            Exchange, discovery, onboarding and agent actions
    app/(payload)/       REST and platform administration routes
    connectors/
      adapters/tractusx/ Tractus-X API, policy, identity and configuration adapter
      hosting/
        kubernetes/      Platform-hosted provisioning and health
        docker/          Self-host Compose bundle and agent
runtimes/
  tractusx/              Pinned runtime profile, chart, values and Docker templates
  common/                Connector-local source-token worker
infra/
  identity/              Identity stacks (test and production) in Docker Compose
  identity-host/         Production identity stack on a separate host
  selfhost-identity/     Wallet bundle for organizations with a self-hosted identity
  public/                HTTPS edge (Caddy)
  kubernetes/            Cluster connection and the connector ingress (Traefik)
  local/                 Same-host kind networking and connector gateway
  charts/                Upstream licenses and chart checksums
scripts/                 Setup, backups, identity installers and tests
docker-compose.yml       Platform services; the files under infra/ add to it
manage.sh                Setup, operations and test commands
```

Tests sit beside their modules, except browser flows in `frontend/e2e/` and deployment and
exchange tests in `scripts/`. Feature components, API calls, types and tests stay in their
feature folder, and shared code is only what several features use. Kubernetes and Docker hosting
stay separate, so a runtime upgrade does not change who operates a connector.
