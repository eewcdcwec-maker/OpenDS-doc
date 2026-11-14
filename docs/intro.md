---
id: intro
title: OpenDS
slug: /
---

# OpenDS

OpenDS is an open-source platform for deploying and operating a dataspace. It provides a
web-based environment where participating organizations can join the dataspace, establish
their identities, deploy connectors, publish data products, define access policies, and
exchange data.

With **Connector-as-a-Service (CaaS)**, the dataspace operator can offer connector provisioning
and management to participating organizations.

## What you can do with it

- **Organization management**: register organizations, manage members and roles, assign connector permissions, and create personal API keys for scripts.
- **Identity management**: use a test identity, a managed identity hosted by OpenDS, or a self-hosted identity with the organization's own wallet.
- **Connector-as-a-Service (CaaS)**: create, deploy and manage dataspace connectors through the OpenDS web application, and export or import their data. Connectors can be hosted and operated by OpenDS or deployed on an organization's own server. 
- **Data publication and access policies**: publish data from HTTP services, login-protected endpoints, Amazon S3 or Azure Blob, including files uploaded through OpenDS. Define who can access data and under which conditions.
- **Data discovery and exchange**: discover published data products across participating organizations, negotiate agreements and exchange data through secure connector-to-connector transfers.
- **Provider control**: monitor who accesses published data, revoke or restore agreements, and stop ongoing transfers.
- **Platform operations** (for operators): configure HTTPS, manage encrypted backups, and monitor services with email alerts.

## Hosting choices

Each organization decides what it runs itself. Connector and identity are independent choices.

|           | Run by OpenDS                        | Run by the organization |
| --------- | ------------------------------------ | ----------------------- |
| Connector | Platform-hosted connector            | Self-hosted connector   |
| Identity  | Test identity or managed identity    | Self-hosted identity    |

## Where to start

- Try it: [Installation](/getting-started/installation), then [Your first data exchange](/getting-started/first-data-exchange)
- Understand how it works: [Architecture](/architecture)
- Use the app: [User guide](/user-guide/overview)
- Run connectors or a wallet on your own servers: [Self-hosting](/self-hosting/self-hosted-connector)
- Operate an installation: [Administration](/administration/configuration)
- Contribute: [Development](/development/development)

## License

OpenDS is released under the [Apache License 2.0](https://github.com/kwe712/OpenDS/blob/main/LICENSE).

## Contact

[<img src="https://www.acs.eonerc.rwth-aachen.de/global/show_picture.asp?id=aaaaaaaaaakevlz" alt="ACS, Institute for Automation of Complex Power Systems" width="300" />](https://www.acs.eonerc.rwth-aachen.de/)

- **Katharina Wehrmeister**, [katharina.wehrmeister@eonerc.rwth-aachen.de](mailto:katharina.wehrmeister@eonerc.rwth-aachen.de)
- **Rezeq Direya**, [rezeq.direya@eonerc.rwth-aachen.de](mailto:rezeq.direya@eonerc.rwth-aachen.de)

[Institute for Automation of Complex Power Systems (ACS)](https://www.acs.eonerc.rwth-aachen.de/)<br />
[E.ON Energy Research Center (E.ON ERC)](https://www.eonerc.rwth-aachen.de/)<br />
[RWTH Aachen University, Germany](https://www.rwth-aachen.de/)
