---
title: API
---

# API and permissions

Everything the web app does goes through the same REST API, so scripts can do it too.
Create an API key under **Organization → API access**. Send it with the organization you want to
act in on every request:

```text
Authorization: users API-Key <your-api-key>
x-tenant-id: <organization-id>
```

Creating a key asks for your password and an expiry (90 days by default); an expired key stops
working within a minute. The in-app API guide has curl and Python examples, including file
downloads and uploads. With `EDGE_TLS=internal`, clients must trust the dataspace CA
([Configuration](/administration/configuration#trusting-the-dataspace-ca)).

## Conventions

- Collections use `/api/<collection>` with Payload pagination (`docs`, `totalDocs`, `page`,
  `limit`); creates and updates return `{doc}`.
- API keys and sessions apply the same organization and connector permissions as the app.
  The app itself uses cookies.
- Credentials and private source configuration never appear in discovery metadata.
- Payload's admin interface at `/platform-admin` is the operator's support and recovery
  tool: it gives platform administrators access to every record of every organization.
  Day-to-day work happens in the app.

## Roles

| Role                                | Can                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization owner or administrator | Organization settings, identity and team, and Manager rights on every connector of the organization                                                     |
| Organization member                 | Work on the connectors they are granted                                                                                                                 |
| Connector Manager                   | Everything on that connector: products, policies, offers, contract uploads, imports, lifecycle, publication, exchanges, and giving other members access |
| Connector Viewer                    | Read that connector's resources                                                                                                                         |
| Platform administrator              | Approve, suspend and offboard organizations; platform settings. Works in the app only in organizations they belong to                                   |

A connector grant does not give access to other members' connectors or to organization
administration.

## Products, policies and offers

Products, policies and offers are stored on the connectors, not in the platform database.
Their REST endpoints read and write the connector's Management API directly.

- Select a running connector when creating a product or policy.
- Withdraw active offers before changing or deleting a published product.
- Policies created outside OpenDS are shown read-only with their original policy document.
  Offers without an OpenDS approval setting must be republished before they can use the
  OpenDS negotiation shortcut.

Lists are paged per connector:

```
GET /api/connector-resources?collection=products&connector=<uuid>&limit=20
```

Follow `nextCursor` with the `cursor` parameter, and reset it when changing filters. Policy
lists also accept `purpose=ACCESS` or `purpose=USAGE`. Results are ordered by connector name,
then resource ID. Live pages do not fetch every record just to show a count, and full policy
documents load when opened.

Publishing is `POST /api/offers/publish`.

## Cloud storage

| Endpoint                                                                                | Purpose                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/connectors/:id/cloud-storage`                                                | Manager: set the connector's AWS and Azure storage. Body `{ "aws": { region, buckets, ... } \| null, "azure": { accounts: [{ name, containers, key }] } \| null }`; a missing key keeps that part. Keys go to the connector's Vault and are never returned. Returns the settings and `taskId`. |
| `POST /api/connectors/:id/files?bucket=<b>&path=` or `?account=<a>&container=<c>&path=` | Manager: upload the request body (up to 100 MB) into one of the connector's buckets or containers at `path`; refused with 409 when a file already exists there. Returns the product source fields.                                                                                             |

Transfers of type `AmazonS3-PUSH` and `AzureStorage-PUSH` take only the location in
`dataDestination` (`bucketName`, `objectName`, or `account`, `container`, `blobName`); the
login comes from the consumer's connector. See [Cloud storage](/guide/cloud-storage).

## Discovery and exchanges

Discovery queries the listed running connectors live; there is no stored index or cache.
Provider reads run in parallel and are reused only within one request.

| Endpoint                                                           | Purpose                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `POST /api/exchange/negotiate`                                     | Start a contract negotiation for an offer                                            |
| `POST /api/exchange/negotiations/<connector>/<negotiation>/cancel` | Cancel a negotiation that has not finished (either side)                             |
| `POST /api/exchange/transfers/start`                               | Start a transfer under an agreement                                                  |
| `GET /api/exchange/agreements`                                     | Agreements, read live from the organization's connectors                             |
| `GET /api/exchange/transfers`                                      | Transfers, read live from the organization's connectors                              |
| `POST /api/exchange/agreements/<connector>/<agreement>/revoke`     | Provider: revoke an agreement; body `{ "reason": "..." }` (optional)                 |
| `POST /api/exchange/agreements/<connector>/<agreement>/restore`    | Provider: restore a revoked agreement                                                |
| `POST /api/exchange/transfers/<connector>/<transfer>/edr`          | Consumer: a current access token for automated, repeated downloads                   |
| `POST /api/exchange/transfers/<connector>/<transfer>/suspend`      | Suspend a running transfer (either side); `resume` and `terminate` work the same way |

The two lists show the organization as consumer by default. Add `role=provider` to list the
agreements and transfers of data it shares, with the consumer in `partner`; provider
agreements also carry `retired` for revoked ones. These actions need the Manager role on the
connector; revoking and restoring only work on the provider's own connector.

Agreements and transfers come in live connector pages of 20, 50 or 100 entries. The first
eligible connector is selected by default; **Select all** walks connectors in name order,
newest entries first within each connector. Pages are a live view, so new records can shift
page boundaries.

## Connector data export and import

Connector Managers can download a connector's data and import it into another compatible
connector, in the app (connector page) or with these routes:

| Route                                           | Contents and behavior                                                                                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/connectors/:id/export-data`           | Products, policies, offers, connector identity metadata, negotiations, agreements and sent and received transfers. All history is paged from the connector until exhausted.                                                 |
| `POST /api/connectors/:id/import-data`          | Body `{ "data": <download JSON>, "publishOffers": false }`. Creates the configuration with new IDs and remapped references. Returns counts, `exchangeRecordsImported: false`, `skippedExchangeRecords` counts and warnings. |
| `GET /api/connectors/:id/export-configuration`  | Products, policies and offers only.                                                                                                                                                                                         |
| `POST /api/connectors/:id/import-configuration` | Body `{ "configuration": <export JSON>, "publishOffers": false }`. Imports configuration only.                                                                                                                              |

- The connector must be RUNNING or DEGRADED and reachable; a self-hosted connector's agent
  must be online.
- Downloads use the `opends-connector-configuration` v1 format, adding `connector`,
  `exportScope` and `exchangeRecords` for full exports.
- Credentials, Vault secrets, tokens, private keys and source data are never included.
  Configure source credentials and review policies before publishing imported offers.
- Imports create new resource IDs, keep existing resources, and skip offers unless
  `publishOffers` is true. If an import fails, OpenDS removes what that attempt created and
  reports any IDs it could not confirm.
- Exchange history is for reference only: the connector has no API to recreate it.
- The configuration part is limited to 5,000,000 JavaScript string code units, 1,000 products,
  2,000 policies and 1,000 offers. Neither export nor import keeps a copy in the platform
  database.
- Export before withdrawing offers if you want to keep their published definitions.

Before a connector is deleted or deprovisioned, the confirmation offers **Download connector
data first**; OpenDS does not archive connector data on its own. A failed download blocks the
removal unless the user chooses to continue without it. An offline or paused connector must
be started first.

## Organizations

Platform administrators approve, suspend and offboard organizations under **Platform
Admin**. Offboarding is also `POST /api/organizations/:id/offboard`: it withdraws offers,
queues connector removal and suspends access. Deleted connectors keep a tombstone so
exchange and audit references stay readable. Members of an organization that is awaiting
approval, rejected or suspended can still sign in: a notice names the state, and they cannot
exchange data until the organization is active. Offboarding removes their access.

Owners and administrators add members under **Organization**. A new email address gets an
account; an existing account receives an invitation (`GET /api/account/invitations`) and
joins only when that account holder accepts it (`POST /api/account/invitations/:id/accept` or
`/decline`). The invitation is shown in the app and, when email is set up, also sent by email.

## API types

The API types are generated from the backend schema and checked in:
`npm --prefix backend run platform:types` regenerates them, including the frontend's copy,
and `npm run typecheck` checks that both match.
