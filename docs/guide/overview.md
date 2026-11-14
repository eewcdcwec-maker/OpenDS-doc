---
id: overview
title: Overview
---

# User guide overview

This guide is for people who use the OpenDS web app: members of an organization that shares or
consumes data in a dataspace.

## The path from data to exchange

```text
Join ─ Identity ─ Connector ─ Data product ─ Policies ─ Offer ─ Agreement ─ Transfer
 you      you        you          provider      provider  provider  consumer    consumer
```

1. **Join** the dataspace: [register or be invited](/guide/organization).
2. Get an **identity**: a test identity to try things, or a production identity.
3. Start a **connector**: [hosted by OpenDS or on your own server](/guide/connectors).
4. As a provider, add a **data product** and the **policies** that govern it, then
   [publish an offer](/guide/publish).
5. As a consumer, [discover offers](/guide/exchange), request or negotiate an agreement and
   start a transfer.

## Key terms

| Term              | Meaning                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Organization      | A legal entity in the dataspace. It has one identity (a DID and a BPN) and any number of connectors. |
| Connector         | The Tractus-X software that exchanges data on your organization's behalf.                    |
| Data product      | A data source offered through a connector: HTTP, login-protected HTTP, Amazon S3, Azure Blob or an uploaded file. |
| Access policy     | Decides who can discover and agree to an offer.                                              |
| Usage policy      | Terms the consumer accepts: time limits, usage purposes, contract reference and others.      |
| Offer             | One data product with an access policy and a usage policy, published in the catalog.         |
| Agreement         | The result of a successful negotiation between a consumer and a provider.                    |
| Transfer          | One delivery of data under an agreement.                                                     |

## Roles in the app

| Role                                | Can                                                                  |
| ----------------------------------- | -------------------------------------------------------------------- |
| Organization owner or administrator  | Manage the organization, identity and team; Manager on every connector |
| Organization member                 | Work on the connectors they are granted                              |
| Connector Manager                   | Everything on that connector                                         |
| Connector Viewer                    | Read that connector's resources                                      |
| Platform administrator              | Approve, suspend and offboard organizations; platform settings       |

See [API and permissions](/reference/api#roles) for the exact rules.
