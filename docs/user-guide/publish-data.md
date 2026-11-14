---
title: Publish data
---

# Publish data

Providers describe their data as a product, decide who may use it and on what terms, and
publish it as an offer.

```text
Data product + Access policy + Usage policy -> Offer
```

Products, policies and offers are stored on the connector, so a running connector must be
selected when creating them.

## Data products

Under **Data products**, add a product of one of these kinds:

| Kind                 | Source                                                                    |
| -------------------- | ------------------------------------------------------------------------- |
| HTTP                 | A URL that the connector fetches                                          |
| Login-protected HTTP | A URL that requires a login, which the connector performs and renews itself |
| Amazon S3            | An object in a bucket that the connector can read                         |
| Azure Blob           | A blob in a container that the connector can read                         |
| File upload          | A file stored in the connector's cloud storage                            |

Give each product a name, a description, categories and tags so that consumers can find it.
Cloud storage setup and limits are described under [Cloud storage](/user-guide/cloud-storage).

### Login-protected sources

- **Login settings**: the login URL and method, token extraction, outgoing headers and token
  lifetime are set in the product form.
- **Credentials**: the login request body with the credentials is entered when the offer is
  published, or on the connector's own server for self-hosted connectors.
- **Storage**: the login details stay on the connector and are never stored in OpenDS.
- **Private networks**: a login service on a private network needs an explicit allowance from
  the operator ([Configuration](/administration/configuration#private-networks)).

## Policies

Under **Policies**, create two kinds of policies:

- **Access policy**: decides who can see the offer in a connector's catalog and agree to it.
  You can allow all verified participants, selected organizations or a **partner group**.
- **Usage policy**: defines the terms of use, such as time limits, usage purposes, a contract
  reference with an attached contract document, jurisdictions, onward sharing and deletion.
  Partners download the contract PDF from the offer in **Discover** before they agree, and a
  checksum lets both sides verify the file.

Some terms are enforced by the connector, while others are contractual and recorded in the
agreement, because data that a consumer has already received cannot be technically controlled.
Which term belongs to which group is shown under
[Policy enforcement](/architecture#policy-enforcement).

**Partner groups** let you change who is allowed without republishing, because changes also
apply to offers that are already published. Removing a member prevents new agreements, while an
existing agreement stays valid until you revoke it. A group used by active offers cannot be
renamed or deleted until those offers are withdrawn.

## Offers

Under **Offers**, publish one product per offer with an access policy and a usage policy.
Partners find the offer under **Discover** once its connector is listed with
**List in discovery** on the connector page.

![The Publish an offer dialog with a summary of what partners will see](../img/publish-offer.png)

- **Provider approval**: with **Automatic**, eligible consumers can request an agreement
  directly, while with **Request approval** you review each access request first. Approval is a
  step in OpenDS and does not stop a partner who contacts your connector directly, so use the
  access policy to restrict which organizations are eligible.
- **Withdraw**: stops new discovery and approval requests, while existing exchange history
  stays. Active offers must be withdrawn before their product or policy can be changed or
  deleted.

Policies created outside OpenDS are shown read-only.
