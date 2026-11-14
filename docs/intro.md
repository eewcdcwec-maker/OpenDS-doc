---
id: intro
title: OpenDS
slug: /
---

# OpenDS

OpenDS is an open-source platform for deploying and managing dataspaces. It provides a web-based environment for organizations to establish identities, manage dataspace connectors, publish data products, define access policies, and exchange data with other participants.

OpenDS provides **Connector-as-a-Service (CaaS)** capabilities, allowing organizations to provision and manage connectors without having to operate the full connector infrastructure themselves. Connectors can run on infrastructure managed by OpenDS or on servers operated independently by participating organizations. An OpenDS installation also provides identity services for its participants and is built on the official Eclipse Tractus-X connector and identity components.

## What you can do with it

- **Organization management**: register organizations, manage members and roles, assign connector permissions, and control access through API keys.
- **Identity management**: create test identities, use identities provided by OpenDS, or connect an organization's own identity and wallet.
- **Connector-as-a-Service (CaaS)**: create, deploy and manage dataspace connectors through the OpenDS web application. Connectors can be hosted and operated by OpenDS or deployed on an organization's own server.
- **Data publication and access policies**: publish data from HTTP services, protected endpoints, Amazon S3, Azure Blob or file uploads. Define who can access data and under which conditions.
- **Data discovery and exchange**: discover published data products across participating organizations, negotiate agreements and exchange data through secure connector-to-connector transfers.
- **Provider control**: monitor who accesses published data, revoke or restore agreements, and stop ongoing transfers.
- **Platform operations**: configure HTTPS, manage encrypted backups, monitor services with email alerts, and export or import connector data.

## Hosting choices

Each organization decides what it runs itself. Connector and identity are independent choices.

|           | Run by OpenDS                             | Run by the organization |
| --------- | ----------------------------------------- | ----------------------- |
| Connector | Platform-hosted connector                 | Self-hosted connector   |
| Identity  | Test identity or wallet hosted by OpenDS  | Own wallet              |

## Where to start

- Try it: [Installation](/getting-started), then [Your first data exchange](/guide/first-exchange)
- Use the app: [User guide](/guide/overview)
- Run connectors or a wallet on your own servers: [Self-hosting](/guide/self-hosted-connector)
- Operate an installation: [Administration](/administration/configuration)
- Contribute: [Development](/development)

OpenDS is released under the Apache-2.0 license.

## Contact

[<img src="https://www.acs.eonerc.rwth-aachen.de/global/show_picture.asp?id=aaaaaaaaaakevlz" alt="ACS, Institute for Automation of Complex Power Systems" width="300" />](https://www.acs.eonerc.rwth-aachen.de/)

- **Katharina Wehrmeister**, [katharina.wehrmeister@eonerc.rwth-aachen.de](mailto:katharina.wehrmeister@eonerc.rwth-aachen.de)
- **Rezeq Direya**, [rezeq.direya@eonerc.rwth-aachen.de](mailto:rezeq.direya@eonerc.rwth-aachen.de)

[Institute for Automation of Complex Power Systems (ACS)](https://www.acs.eonerc.rwth-aachen.de/)<br />
[E.ON Energy Research Center (E.ON ERC)](https://www.eonerc.rwth-aachen.de/)<br />
[RWTH Aachen University, Germany](https://www.rwth-aachen.de/)
