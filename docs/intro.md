---
id: intro
title: Introduction
slug: /
---

# OpenDS

OpenDS runs a complete dataspace from one server. Organizations join through a web app, get a
verified identity, start connectors, publish data under policies and exchange it with each
other. It is built on the official, unmodified Eclipse Tractus-X connector and identity
components, and each installation is its own dataspace that issues its participants'
credentials.

## What you can do with it

- **Organizations and teams**: registration with administrator approval, members and roles,
  per-connector Manager and Viewer access, API keys and an activity log.
- **Identity**: disposable test identities, production identities hosted by OpenDS, or an
  organization's own `did:web` and wallet.
- **Connectors**: created and run by OpenDS on Kubernetes, or self-hosted by an organization on
  its own server with Docker, managed from the same app.
- **Data products and policies**: HTTP, login-protected, Amazon S3 and Azure Blob sources, and
  file upload; access and usage policies with partner groups, time limits and usage purposes.
- **Discovery and exchange**: a live catalog across organizations, optional provider approval,
  negotiation, agreements, transfers and repeatable automated downloads.
- **Provider control**: see who uses your data, revoke and restore agreements, stop transfers.
- **Operations**: HTTPS with Let's Encrypt or the dataspace's own CA, encrypted backups,
  monitoring with email alerts, connector data export and import.

## How it fits together

```text
Browser ── OpenDS app ── OpenDS API and worker ── PostgreSQL
                                  │
          ┌───────────────────────┼─────────────────────────┐
  Platform-hosted connectors  Self-hosted connectors   Identity services
  (Kubernetes)                (organization's server)  (issuer, wallets, directory)
```

OpenDS is the management platform; the connectors do the actual data exchange. Products,
policies, offers and exchange history live on each organization's connectors, and OpenDS reads
them live instead of keeping copies.

## Where to go next

:::tip New to OpenDS?
Install it ([Installation](/getting-started)), then follow
[Your first data exchange](/guide/first-exchange): two organizations, one offer and a
downloaded file in about half an hour.
:::

| You want to                                     | Read                                              |
| ----------------------------------------------- | ------------------------------------------------- |
| Install OpenDS on a server                      | [Installation](/getting-started)                  |
| Try a complete exchange                         | [Your first data exchange](/guide/first-exchange) |
| Share or consume data as an organization        | [User guide](/guide/overview)                     |
| Run your connector or wallet on your own server | [Self-hosted connector](/guide/self-hosted-connector), [Your own wallet](/guide/organization-wallet) |
| Run, back up and upgrade an installation        | [Operations](/administration/operations)          |
| Understand how it works                         | [Architecture](/architecture)                     |
| Automate it from your own systems               | [API and permissions](/reference/api)             |
| Work on the source code                         | [Development](/development)           |

## Status and limits

OpenDS is intended for development and evaluation; it is not a certified production system.
Identity services run as single replicas. Before a production deployment, provide managed trust
and identity services, a Vault with an external unseal mechanism, TLS, network isolation,
backups and monitoring. Federation with other dataspaces, subscriptions and runtime enforcement
of organization-specific business terms are not supported. Agreements can record those terms,
but OpenDS does not enforce them at runtime.

OpenDS is released under the Apache-2.0 license.
