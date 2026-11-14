---
title: Architecture
---

# Architecture

OpenDS is the management platform around a dataspace, not a connector itself. Each
organization's connectors do the actual data exchange; OpenDS creates and runs them, gives
them identities, and offers one app for publishing, discovering and exchanging data.

```text
Browser ── OpenDS app (frontend) ── OpenDS API and worker (backend) ── PostgreSQL
                                          │
              ┌───────────────────────────┼──────────────────────────────┐
              │                           │                              │
   Platform-hosted connectors     Self-hosted connectors       Identity services
   (Kubernetes, managed by        (Docker on the organization's (issuer, wallets, BDRS;
    OpenDS)                        server, driven by its agent)   Docker Compose)
```

## Components

| Part              | What it is                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Frontend          | React app with Ant Design and TanStack Query                                                             |
| Backend           | Payload 3 on Next.js: REST API, authentication, permissions, business rules                              |
| Worker            | Runs queued jobs: connector provisioning, identity tasks, health checks, notifications                   |
| PostgreSQL        | Users, organizations, permissions, approvals and operational records                                     |
| Connectors        | Official, unmodified Tractus-X EDC 0.13: a control plane, data plane, PostgreSQL and Vault per connector |
| Identity services | Tractus-X IdentityHub, IssuerService and BDRS, per [identity services](/identity/identity-hosting)                        |

The backend owns every permission and business rule. The browser never talks to Vault,
Kubernetes or a connector's management API.

Backend and worker run without root rights or Linux capabilities, and connector pods get no
Kubernetes API token.

## Where data lives

- **Platform database**: users, organizations, memberships, permissions, approval
  workflows, audit entries and operational records.
- **Connectors**: products, policies, offers, source configuration, negotiations,
  agreements and transfers. OpenDS reads them live and keeps no copies.
- **Connector Vaults**: source credentials and connector secrets. Self-hosted credentials
  are entered on the connector's own host.
- **Never stored**: access tokens (EDRs), dataset bytes, and self-hosted Management API
  request and response bodies. Self-host EDR responses pass through backend memory and are
  discarded after delivery, which assumes one backend instance. Downloads go directly
  through the connector's data plane.

Connector Vaults keep their data across restarts and unseal themselves; see
[Development](/development#internals) for how.

## Connector hosting

Runtime and hosting are independent:

- **Platform-hosted**: OpenDS manages the connector on Kubernetes, either the local cluster
  setup creates or a [separate cluster](/administration/remote-cluster).
- **Self-hosted**: the organization runs the connector with Docker Compose on its own server.
  A small agent next to it polls OpenDS for queued operations and runs them locally, so
  OpenDS never needs inbound access to the management API. See
  [Self-hosted connector](/guide/self-hosted-connector).

Each platform-hosted connector runs in its own namespace with a network policy: its pods
reach their own namespace, the cluster's DNS and ingress, and addresses outside the cluster,
but not other connectors' pods and not the link-local range of cloud metadata services. The
policy is applied when a connector is provisioned and needs a cluster network that enforces
NetworkPolicy (the local cluster does).

## Connector runtime

The connector is the official Tractus-X EDC 0.13.0 distribution. Its version, images, chart
checksum, API version and endpoints are declared in `runtimes/tractusx/profile.json`. The
images are unmodified upstream releases, and the packaged Helm chart is the upstream archive,
checked against its recorded SHA-256. OpenDS does not patch Java classes, build a connector
fork or implement DSP or DCP itself; deployment values and startup ordering are OpenDS
configuration.

OpenDS code around the connector: the app and API, permissions, product search and
approvals, the Management API and policy adapters (`backend/src/connectors/adapters/tractusx/`),
Kubernetes provisioning, the self-host Docker bundle and agent, and the source-token renewal
worker. Unsupported runtime versions fail explicitly; upgrades are described in
[Development](/development#runtime-upgrades).

## Identity

Each organization has exactly one DID and one BPN, and all of its connectors run as that
identity. The primary protocol identity is the DID (DCP 1.0, DSP 2025-1); the runtime also
requires a BPN and the BDRS directory, which stay inside the Tractus-X adapter. OpenDS
allocates BPNs within its dataspace; they are not registered business BPNs, and this is no
Catena-X onboarding or certification. Catalog requests use DID-based DSP version discovery
with a known provider address. Identity modes, wallets and hosting are described in
[identity services](/identity/identity-hosting).

## Offers, policies and enforcement

```text
Data product + Access policy + Usage policy -> Offer
Offer -> Optional provider approval -> Negotiation -> Agreement -> Transfer
```

Access policies decide who can discover and agree to an offer. Allow-lists hold BPNs, picked
from the organization directory, and become the runtime's `BusinessPartnerNumber` constraint
when the offer is published.

Partner groups are kept on the provider's connectors (the runtime's business partner group
store), and a policy refers to its group (`BusinessPartnerGroup`), not to a copy of its
members. Adding or removing a member therefore applies to offers that are already published,
without republishing. OpenDS writes a change to every running connector of the organization
when the group is saved, and again before an offer with a group policy is published. The
health check corrects a connector that missed a change: platform-hosted connectors within a
minute, self-hosted ones within ten minutes of their agent being online. Removing a member
stops new agreements; an agreement the member already has stays valid until the provider
revokes it. A group in use by a published offer cannot be renamed or deleted.

Every policy term shows who enforces it:

| Enforcement | Terms                                                                      | Meaning                                                                                       |
| ----------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Connector   | Verified participants, allowed organizations, partner groups, time limits  | The provider's connector checks credentials and BPN, and the contract expiry on each transfer |
| Contractual | Usage purpose, contract reference, jurisdictions, onward sharing, deletion | Recorded in the agreement; data already received cannot be controlled                         |

Time limits become the connector's contract expiry constraint (`inForceDate`, a fixed date
or `contractAgreement+<n>d`), so transfers are refused after expiry. Every usage policy
carries `UsagePurpose` (the chosen purposes or the default) and `FrameworkAgreement`, which
Tractus-X requires. A contract reference becomes `ContractReference`; an uploaded contract
PDF, stored only in OpenDS, adds its SHA-256.

## Provider controls

Providers see who uses their data and can revoke agreements and stop transfers; see
[Discover and exchange data](/guide/exchange#as-a-provider-see-and-control-use). The
organization directory shows signed-in members the approved organizations of their dataspace
(name, BPN, DID and running connectors' DSP addresses), never user data.

## Login-protected data sources

HTTP sources can require a login: configurable login method, token extraction, outgoing
headers and token lifetime. A worker next to the connector logs in and refreshes the token
before it expires; self-hosted connectors use their agent. The login details stay on the
connector. Private login services need an explicit allowance
([Configuration](/administration/configuration#private-networks)).
