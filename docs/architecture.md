---
title: Architecture
---

# Architecture

OpenDS manages the dataspace infrastructure and coordinates connector operations. Data
exchange is performed by the connectors of the participating organizations, while OpenDS
provides centralized management of connector deployments, identities and data exchange
workflows. Connectors are either hosted by the platform on Kubernetes or self-hosted on a
participant's own infrastructure and controlled through the OpenDS agent.

![OpenDS architecture: the platform manages platform-hosted connectors on Kubernetes and self-hosted connectors through their agent, while connectors exchange data with other participants and read from data sources](./img/architecture.png)

## Components

| Part              | Description                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Frontend          | The web application, built with React, Ant Design and TanStack Query                                          |
| Backend           | Payload 3 on Next.js, which provides the REST API, authentication, permissions and business rules             |
| Worker            | Runs queued jobs such as connector provisioning, identity tasks, health checks and notifications              |
| PostgreSQL        | Stores users, organizations, permissions, approvals and operational records                                   |
| Connectors        | Official Tractus-X EDC, each with its own control plane, data plane, PostgreSQL and Vault                     |
| Identity services | Tractus-X IdentityHub, IssuerService and BDRS, as described in [Identity services](/identity/identity-hosting) |

The backend enforces all permissions, so the browser never accesses Vault, Kubernetes or the
Management APIs of the connectors directly. The backend and worker run without root privileges or
Linux capabilities, and connector pods are not given a Kubernetes API token.

## Where data lives

- **Platform database**: users, organizations, memberships, permissions, approval workflows,
  audit entries and operational records.
- **Connectors**: data products, policies, offers, source configurations, negotiations,
  agreements and transfers. OpenDS reads this information directly from the connectors
  without maintaining copies.
- **Connector Vaults**: source credentials and connector secrets. For self-hosted connectors,
  credentials are entered and stored on the organization's own host.
- **Not stored by OpenDS**: EDR access tokens, dataset bytes, and self-hosted Management API
  request and response bodies. Self-hosted EDR responses are held in backend memory only and
  discarded after delivery. Downloads go directly through the connector's data plane.

## Connector hosting

Runtime and hosting are independent:

- **Platform-hosted**: OpenDS manages connectors on Kubernetes, either in the local cluster
  created during setup or in a [separate cluster](/administration/remote-cluster).
- **Self-hosted**: the organization runs the connector using Docker Compose on its own server.
  A lightweight agent polls OpenDS for queued operations and executes them locally. OpenDS
  therefore requires no inbound access to the connector's Management API. See
  [Self-hosted connector](/guide/self-hosted-connector).

Each platform-hosted connector runs in its own Kubernetes namespace with a network policy. The
policy allows its pods to communicate within that namespace, access cluster DNS and ingress,
and reach external addresses. It blocks communication with pods in other connector namespaces
and prevents access to cloud infrastructure metadata services. The policy is applied during
provisioning and requires a Kubernetes network implementation that enforces NetworkPolicy, as
provided by the local cluster.

## Connector runtime

OpenDS uses the Tractus-X EDC 0.13.0 distribution as its connector runtime. The upstream
container images and Helm chart are used without modifications. Runtime-specific settings,
including image versions, API version, endpoints and chart checksum, are maintained in
`runtimes/tractusx/profile.json`. OpenDS handles connector deployment and configuration, and
integrates with the runtime through its Management API and policy adapters. It does not
modify the EDC Java implementation, implement DSP or DCP itself, or maintain a connector
fork.

## Identity

Each organization has one DID and one BPN, shared by all its connectors. The DID serves as the
primary protocol identity for DCP 1.0 and DSP 2025-1. The BPN and BDRS directory are also
required by the Tractus-X runtime and are handled within the Tractus-X adapter.

OpenDS allocates BPNs within its own dataspace. Catalog requests use DID-based DSP version
discovery with a known provider address. Identity types, wallets and hosting are described in
[Identity services](/identity/identity-hosting).

## Offers, policies and enforcement

```text
Data product + Access policy + Usage policy -> Offer
Offer -> Optional provider approval -> Negotiation -> Agreement -> Transfer
```

Access policies decide who can discover an offer and agree to it. Allow-lists contain BPNs,
which are selected from the organization directory and become the runtime's
`BusinessPartnerNumber` constraint when the offer is published.

Partner groups are kept on the provider's connectors in the runtime's business partner group
store, and a policy refers to the group (`BusinessPartnerGroup`) rather than to a copy of its
members.

- Adding or removing a member also applies to offers that are already published, without
  republishing them.
- OpenDS writes each change to every running connector of the organization when the group is
  saved, and again before an offer with a group policy is published.
- The health check corrects connectors that missed a change, within a minute for
  platform-hosted connectors and within ten minutes of the agent being online for self-hosted
  ones.
- Removing a member prevents new agreements, while an existing agreement of that member stays
  valid until the provider revokes it.
- A group used by a published offer cannot be renamed or deleted.

Each policy term states who enforces it:

| Enforcement | Terms                                                                      | Meaning                                                                                              |
| ----------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Connector   | Verified participants, allowed organizations, partner groups, time limits  | The provider's connector checks credentials and BPN, and the contract expiry on each transfer        |
| Contractual | Usage purpose, contract reference, jurisdictions, onward sharing, deletion | Recorded in the agreement, while data that has already been received cannot be technically controlled |

Time limits become the connector's contract expiry constraint (`inForceDate`, with a fixed date
or `contractAgreement+<n>d`), so transfers are refused after expiry. Every usage policy carries
`UsagePurpose`, with the chosen purposes or the default, and `FrameworkAgreement`, which
Tractus-X requires. A contract reference becomes `ContractReference`, and an uploaded contract
PDF, which is stored only in OpenDS, adds its SHA-256.

## Provider controls

Providers can see who uses their data, revoke agreements and stop transfers, as described in
[Discover and exchange data](/guide/exchange#as-a-provider-see-and-control-use). The
organization directory shows signed-in members the approved organizations of their dataspace,
including name, BPN, DID and the DSP addresses of running connectors, but never any user data.
