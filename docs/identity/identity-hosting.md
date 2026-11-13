---
id: identity-hosting
title: Identity services
---

# Identity services

For operators: how the identity services of a dataspace are built, where they run and how to
move them to a separate host. Organizations choose and change their identity under
[Identity](/guide/identity).


The production identity services of an OpenDS dataspace form one **identity stack**:
the production issuer, one IdentityHub for the wallets of organizations with a managed identity,
the production BDRS directory, one Vault and PostgreSQL. The operator chooses where
it runs:

- **Local (default)**: on the OpenDS server itself, in Docker Compose, published through
  the platform's own HTTPS entry. Setup installs it when you pass `--public-domain`.
- **Separate host**: on another server, for example a small VPS with a public domain,
  while the platform stays on a private network.

Test identities (test issuer, test IdentityHub and a test BDRS) always run on the OpenDS
server, so an installation without a domain is complete on its own and test participants
never appear in the production directory. Kubernetes runs connectors only, so the
connector cluster can be the local one or a remote cluster.

## Choose the domain once

Every production DID contains the identity domain: the issuer's, every managed
identity's, and the issuer named in every credential. **Changing the domain later
invalidates all production identities and credentials.** Managed identities then need
new identities, and organizations with their own wallet must request their credentials
again. Pick a name you will keep (for example `dataspace.example.org` or
`id.example.org`), not an address-based name such as sslip.io, before you approve the
first production organization.

## Which layout to use

In DCP the issuer delivers credentials to each holder's wallet, and partners resolve DIDs
and call the wallet's credential service. Those endpoints must be reachable by every
participant under a stable HTTPS name.

- Use the **local** stack when the OpenDS server is reachable by all participants: a
  public domain, or a private network where everyone trusts the dataspace CA.
- Use a **separate host** when the OpenDS server must stay private but participants are
  on the internet.

| Component                                                                    | Runs on                                                                            | Reachable from                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Platform (UI, API, worker, database, backups, HTTPS edge)                    | OpenDS server, Docker Compose                                                      | Users and administrators                                       |
| Test identities (test issuer, test IdentityHub, test BDRS)                   | OpenDS server, Docker Compose                                                      | Participants of the dataspace's test phase                     |
| Production identity stack (issuer, IdentityHub for managed identities, BDRS) | OpenDS server (default) or a separate host, Docker Compose                         | All participants over HTTPS; management only from the platform |
| Managed connectors                                                           | Kubernetes: local kind or a remote cluster                                         | Participants over HTTPS                                        |
| Self-hosted connectors and own wallets                                       | Organizations' own servers (`runtimes/tractusx/docker`, `infra/selfhost-identity`) | Their own choice                                               |

The stack uses the official, unmodified Tractus-X images. A server with 2 vCores, 4 GB RAM
and swap enabled fits a separate identity host.

## DIDs

| Identity                     | Local stack                             | Separate host                           |
| ---------------------------- | --------------------------------------- | --------------------------------------- |
| Production issuer            | `did:web:<domain>:api:dataspace:issuer` | `did:web:<identity host>:opends:issuer` |
| Managed identity             | `did:web:<domain>:api:identities:<id>`  | `did:web:<identity host>:opends:<id>`   |
| Organization with own wallet | `did:web:<its own domain>`              | `did:web:<its own domain>`              |

`<id>` is the identity's resource ID (a UUID). Test identities always use the OpenDS
server's domain.

## Public and private endpoints

The stack's HTTPS entry (the platform edge when local, its own Caddy on a separate host)
serves only DID documents, the IdentityHub DCP and STS endpoints, credential requests and
revocation lists, and the BDRS directory. Everything else (the IdentityHub, IssuerService
and BDRS management APIs, the Vaults, PostgreSQL) is private: on the Compose network when
local, on the separate host's loopback interface otherwise. The STS rotation token may
write STS secrets and cannot read them.

## Flows

- **Approval of a managed identity**: the platform creates the organization's
  context in the stack's IdentityHub, registers it at the production issuer, requests its
  credentials and publishes its entry in the production BDRS.
- **Connectors**: managed and self-hosted connectors get tokens from the stack's STS,
  present credentials from its IdentityHub, and resolve partners through the BDRS of their
  organization's identity type (test or production).
- **Organizations with their own wallet**: their wallet requests credentials from the
  stack's issuer; the platform verifies their DID document and an ownership challenge
  before approval.
- **Offboarding and STS rotation** work the same wherever the stack runs.

## Separate host

Requirements: a Linux server with Docker, an SSH user with sudo, TCP 80 and 443 open to
the internet, and a DNS name pointing at it. From the OpenDS server, after
`./manage.sh setup`:

```bash
bash scripts/identity-host-install.sh opends@203.0.113.20 id.example.org
```

The script can be run again to update the stack. It:

- installs the stack under the SSH user's `~/opends`, with Caddy and a Let's Encrypt
  certificate for the host name;
- hardens SSH: it drops sessions whose client is gone (`ClientAliveInterval`), so a broken
  link never blocks its own reconnect, and allows 3 password tries per connection;
- on Debian-based hosts, installs `fail2ban` (an address is blocked after 5 failed SSH logins
  in 10 minutes; the OpenDS server never is) and automatic security updates. Docker comes from
  its own repository and is updated by hand, since an update restarts the stack. Turning off
  SSH password logins (`PasswordAuthentication no`) is stronger still, once every
  administrator logs in with a key;
- creates an SSH link (container `identity-link`) from the OpenDS server to the host. The
  OpenDS server connects out, so it needs no inbound access. The management APIs listen
  only on the host's loopback interface and are forwarded through the link; the link's key
  may only open these forwards (`permitopen`, `permitlisten`) and is accepted only from the
  OpenDS server's address;
- keeps the DID documents served by the platform: Caddy forwards the `did.json` paths
  through the link, so only their public parts leave the platform;
- adds a second key, allowed only to run `scripts/identity-host-backup.sh`, so the
  platform's backup service fetches the stack's PostgreSQL dump and Vault files and stores
  them with its own backups. The Vault unseal key stays on the host so Vault unseals itself
  after a restart; the backups hold it too.

Notes:

- **Own wallets** must be reachable from the identity host, since the issuer resolves
  their DID and delivers credentials to their wallet. A public identity host cannot reach
  wallets on a private network; organizations there use a wallet hosted by OpenDS.
- **Moving from a local stack** changes the production issuer's DID, so every production
  organization is affected:
  - Managed identities cannot move, since their DIDs name the old domain (see "Choose the
    domain once"). They get new identities on the identity host automatically.
  - Organizations with their own wallet keep their DID, but their credentials came from the
    old issuer. Their identity returns to **Awaiting credentials**, and the Organization page
    shows the new issuer's DID; they run `./wallet.sh request-credentials <that DID>`.
  - Existing connectors keep the old identity and the old issuer until they are provisioned
    again; until then new negotiations and transfers fail. Reprovisioning removes a
    connector's products and policies, so export each connector first (**More → Export
    connector data**) and import afterwards.
  - The previous `.env` is kept in `.deploy/env.before-identity-host` for a rollback, and the
    old production stack keeps running on the OpenDS server for that reason. Once you no
    longer need the rollback, stop it with `docker compose -p opends-identity-production down`
    (add `-v` only when you are sure, since that deletes its keys).

## Stacks

The identity services run in Docker Compose, never in Kubernetes, as two stacks of the
same file (`infra/identity/compose.yaml`), managed by
`./manage.sh identity` (`scripts/identity-stacks.sh`):

- **test**: test identities. Always on the OpenDS server.
- **production**: managed and self-hosted identities. With an HTTPS domain, on the OpenDS
  server by default, or on a separate host (below).

Kubernetes runs connectors only.

## Components

Each stack runs the official, unmodified images:

| Component                           | Version          | Role                                                                     |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| Tractus-X IdentityHub               | 0.4.1 (EDC 0.17) | Wallets of the stack's organizations: one participant context each       |
| Tractus-X IssuerService             | 0.4.1            | The stack's issuer: `opends-issuer` (test) or `opends-production-issuer` |
| Tractus-X BDRS                      | 0.6.0            | The stack's BPN-to-DID directory; trusts only the stack's issuer         |
| PostgreSQL 18, HashiCorp Vault 1.20 |                  | Persistent stores; the stack's Vault holds private keys                  |

Credentials: MembershipCredential, BpnCredential, DataExchangeGovernanceCredential
(`contractVersion` 1.0, required by the `FrameworkAgreement` policy) and
UsagePurposeCredential. The issuer's upstream `holder` attestation turns the
properties OpenDS registers for each holder into claims.

## Public endpoints

With `PUBLIC_DOMAIN` set, one HTTPS hostname serves everything
(`infra/public/Caddyfile`):

| Path                                                                     | Target                                       |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| `/api/test-identities/<id>/did.json`, `/api/identities/<id>/did.json`    | DID documents of test and managed identities |
| `/api/test-identities/issuer/did.json`, `/api/dataspace/issuer/did.json` | Test and production issuer DIDs              |
| `/identity/credentials`, `/identity/sts`                                 | Test IdentityHub DCP endpoints               |
| `/issuer/issuance`, `/issuer/statuslist`                                 | Test issuance and revocation lists           |
| `/bdrs/directory`                                                        | Test BPN-DID directory                       |
| `/production-identity/…`, `/production-issuer/…`, `/production-bdrs/…`   | The same for the production stack            |
| `/connectors/<slug>/api/v1/dsp`, `/connectors/<slug>/api/public`         | Managed connectors                           |

Management APIs, Vault and PostgreSQL stay on the private `opends-identity` Docker
network that only the backend and the installer use. Without a domain, an installation
runs the test stack only, and its web server publishes the same test paths over HTTP on
`PUBLIC_HOST` (port 8081).

## Lifecycle

- **Test and managed identities**: approval creates the IdentityHub context, registers the
  holder, requests credentials and publishes the BDRS entry. The identity is Ready when all
  credentials are delivered and none is revoked.
- **Self-hosted identities**: OpenDS generates the DID document from the organization's
  public key, verifies its publication and a signed single-use challenge, and
  checks the organization's STS. After administrator approval the organization's
  wallet requests its credentials; OpenDS activates the identity once all are
  issued. See [Your own wallet](/guide/organization-wallet) for the
  supported wallet bundle and setup flow.
- **Offboarding** withdraws the DID document, then removes the BDRS entry,
  revokes credentials, deletes the issuer holder, credentials and participant
  context, and asserts nothing remains.

## Tests

The runtime end-to-end test covers test identities with platform-hosted connectors; the
self-host test covers STS rotation through the agent; the
[two-host integration test](/development/two-host-test) covers managed and self-hosted
identities, the production issuer and approval, offboarding and an organization on another
server. See [Development](/development#tests).

## Known limitations

- IssuerService 0.4.1 has no DID management API. Its DID document is read from
  the private DID publisher and republished by OpenDS; changing the issuer's DID
  or endpoint recreates its context, which the installer allows only while no
  holders exist.
- IdentityHub 0.4.1 cannot delete credential requests; OpenDS removes them with a
  database role restricted to that one table.
- An organization's connectors share one STS client secret. IdentityHub 0.4.1 has
  one STS account per participant context (that is, per DID) and no API to add
  accounts or change the secret. OpenDS rotates hosted secrets by writing
  IdentityHub's Vault entry, which IdentityHub reads on every token request, with a
  token that may write but not read IdentityHub's secrets. Per-connector secrets
  need a later IdentityHub.
- Without a domain, everything, including self-hosted connectors, uses unencrypted HTTP
  and only test identities exist. That mode is for trying OpenDS on a trusted network.
- One replica per identity service. Their PostgreSQL and Vault state is part of the
  platform backups; production use also needs a key rotation procedure.

## Operations

- **Backups**: PostgreSQL dumps and Vault snapshots, encrypted, with the platform's
  backups.
- **Updates**: images are pinned; upgrades follow the platform's runtime upgrade rules.
- **Monitoring**: the platform's identity checks cover the stack wherever it runs, including
  organizations whose wallet is missing.

## Rebuilding a lost identity host

If the identity host is lost or has to be set up again, install a new one with the same host
name. The production DIDs then stay the same:

1. Point the host name at the new server (or keep the old server and wipe it).
2. On the OpenDS server, run the installer again:

   ```bash
   bash scripts/identity-host-install.sh opends@203.0.113.20 id.example.org
   ```

   A server without the stack gets a new production issuer, new Vault keys and empty
   wallets. The installer links the OpenDS server to it as before.

3. Under **Platform Admin → Operations**, select **Check now**. The check **Organization
   identities** lists each organization with a managed identity whose wallet is gone and
   shows those organizations an **Identity setup needs attention** notice.
4. The owners of those organizations select **Retry** on the **Organization** page. OpenDS
   sets the identity up again with the same DID: a new wallet, the issuer registration, new
   credentials and the directory entry.
5. Organizations with a self-hosted identity keep their own wallets, but their credentials
   were signed by the old issuer: they request their credentials again from their wallet.

Platform backups contain the identity host's database and Vault, but `backup restore` does
not restore them onto an identity host; rebuilding as above is the supported path.
