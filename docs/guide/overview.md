---
id: overview
title: Overview
---

# User guide overview

This guide is for members of organizations that share or consume data in an OpenDS dataspace
and work with the OpenDS web application.

## From data to exchange

1. **Join** the dataspace by [registering or accepting an invitation](/guide/organization).
2. **Get an identity**, either a test identity to try things out or a production identity
   ([Identity](/guide/identity)).
3. **Start a connector**, hosted by OpenDS or on your own server
   ([Connectors](/guide/connectors)).
4. **As a provider**, add a data product and the policies that govern it, then
   [publish an offer](/guide/publish).
5. **As a consumer**, [discover offers](/guide/exchange), request an agreement and start a
   transfer.

## Key terms

| Term          | Meaning                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Organization  | A legal entity in the dataspace with one identity and any number of connectors                       |
| Connector     | The software that exchanges data on behalf of an organization                                        |
| Data product  | A data source offered through a connector, such as an HTTP endpoint, Amazon S3, Azure Blob or a file |
| Access policy | Decides who can discover an offer and agree to it                                                    |
| Usage policy  | The terms the consumer accepts, such as time limits, usage purposes or a contract reference          |
| Offer         | A data product published with an access policy and a usage policy                                    |
| Agreement     | The result of a successful negotiation between a consumer and a provider                             |
| Transfer      | One delivery of data under an agreement                                                              |

## Roles

| Role                                | Permissions                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Organization owner or administrator | Manages the organization settings, identity and team, and is Manager on every connector of the organization                        |
| Organization member                 | Works on the connectors they have been granted                                                                                     |
| Connector Manager                   | Can do everything on that connector, including products, policies, offers, imports, lifecycle, exchanges and access for other members |
| Connector Viewer                    | Can view the resources of that connector                                                                                           |
| Platform administrator              | Approves, suspends and offboards organizations and manages platform settings, and works in the app only in their own organizations |

A connector grant does not give access to other connectors or to the administration of the
organization. API keys carry the same permissions as their owner.
