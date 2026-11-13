---
id: intro
title: OpenDS
slug: /
---

# OpenDS

OpenDS is an open-source platform for deploying and managing dataspaces. It provides a web-based environment for organizations to establish identities, manage dataspace connectors, publish data products, define access policies, and exchange data with other participants.

OpenDS provides **Connector-as-a-Service (CaaS)** capabilities, allowing organizations to provision and manage connectors without having to operate the full connector infrastructure themselves. Connectors can run on infrastructure managed by OpenDS or on servers operated independently by participating organizations. An OpenDS installation also provides identity services for its participants and is built on the official Eclipse Tractus-X connector and identity components.

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

OpenDS is released under the Apache-2.0 license.
