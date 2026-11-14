---
title: Overview
---

# User guide overview

This guide is for members of organizations that share or consume data in an OpenDS dataspace
and work with the OpenDS web application.

## From joining to exchange

1. **Join** the dataspace by [registering or accepting an invitation](/user-guide/organization-and-team).
2. **Choose an identity type** when you register: a test identity to try things out, or a
   production identity ([Identity](/user-guide/identity)).
3. **Start a connector**, hosted by OpenDS or on your own server
   ([Connectors](/user-guide/connectors)).
4. **As a provider**, add a data product and the policies that govern it, then
   [publish an offer](/user-guide/publish-data).
5. **As a consumer**, [discover offers](/user-guide/discover-and-exchange-data), request an agreement and start a
   transfer.

## Key terms

| Term          | Meaning                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Organization  | A legal entity in the dataspace with one identity and any number of connectors                       |
| Connector     | The software that exchanges data on behalf of an organization                                        |
| Data product  | A data source offered through a connector, such as an HTTP endpoint, Amazon S3 or Azure Blob |
| Access policy | Decides who can discover an offer and agree to it                                                    |
| Usage policy  | The terms the consumer accepts, such as time limits, usage purposes or a contract reference          |
| Offer         | A data product published with an access policy and a usage policy                                    |
| Agreement     | The result of a successful negotiation between a consumer and a provider                             |
| Transfer      | One delivery of data under an agreement                                                              |
| DID           | The decentralized identifier of an organization, which partners use to verify its identity           |
| DSP address   | The address at which partners reach a connector, shown on the connector page as **Protocol endpoint**. Needed when the connector is not listed in discovery |
| Wallet        | The service that holds an organization's keys and credentials. It is hosted by OpenDS or self-hosted |
| STS secret    | The secret all connectors of an organization use to obtain tokens from its wallet                    |

## Roles

| Role                                | Permissions                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Organization owner or administrator | Manages the organization settings and team, and is Manager on every connector of the organization. Only the owner can change the identity                        |
| Organization member                 | Works on the connectors they have been granted                                                                                     |
| Connector Manager                   | Can do everything on that connector, including products, policies, offers, imports, lifecycle, exchanges and access for other members |
| Connector Viewer                    | Can view the resources of that connector                                                                                           |
| Platform administrator              | Approves, suspends and offboards organizations and manages platform settings. In the app, they can only work in organizations they belong to |

A connector grant does not give access to other connectors or to the administration of the
organization. An API key has the same permissions as the member who created it.
