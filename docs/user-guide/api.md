---
title: API
---

# API and permissions

Everything the web application does goes through the same REST API, so scripts can do the same.
Create a personal API key under **API access** and send it, together with the organization you
want to act in, on every request:

```text
Authorization: users API-Key <your-api-key>
x-tenant-id: <organization-id>
```

The organization ID is shown under **API access**, in the **Connect** card, in the row for your
organization, with a copy button.

Creating a key asks for your password and an expiry, which is 90 days by default. An expired
key stops working within a minute. The API guide in the app has curl and Python examples, including
file downloads and uploads. With `EDGE_TLS=internal`, clients must trust the dataspace CA
([Configuration](/administration/configuration#trusting-the-dataspace-ca)).

## Conventions

- **Collections**: `/api/<collection>` with paginated results (`docs`, `totalDocs`, `page`,
  `limit`). Creates and updates return `{doc}`.
- **Permissions**: API keys apply the same organization and connector permissions as the app,
  as listed under [Roles](/user-guide/overview#roles).
- **Records panel**: `/platform-admin` is the raw admin interface with full edit access to
  every record of every organization. Platform administrators open it with the **Records
  panel** button on the **Platform Admin** page. It is for support and recovery only.
  Day-to-day administration, such as approvals, email and backups, happens on the **Platform
  Admin** page itself.

## Products, policies and offers

Products, policies and offers are stored on the connectors. Select a running connector
when creating them. Active offers must be withdrawn before their product or policy can be
changed or deleted.

Lists are paged per connector:

```
GET /api/connector-resources?collection=products&connector=<uuid>&limit=20
```

Follow `nextCursor` with the `cursor` parameter and reset it when changing filters. Policy
lists also accept `purpose=ACCESS` or `purpose=USAGE`. Results are ordered by connector name,
then resource ID. Offers are published with `POST /api/offers/publish`.

## Cloud storage

| Endpoint                                                                                | Purpose                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/connectors/:id/cloud-storage`                                                | Sets the connector's AWS and Azure storage (Manager). Body `{ "aws": { region, buckets, ... } \| null, "azure": { accounts: [{ name, containers, key }] } \| null }`. A missing key keeps the stored one. Keys are never returned. The response contains the settings and a `taskId`. |
| `POST /api/connectors/:id/files?bucket=<b>&path=` or `?account=<a>&container=<c>&path=` | Uploads the request body of up to 100 MB into one of the connector's buckets or containers at `path` (Manager). Returns 409 when a file already exists there. Otherwise, returns the product source fields.                         |

Transfers of type `AmazonS3-PUSH` and `AzureStorage-PUSH` take only the location in
`dataDestination` (`bucketName` and `objectName`, or `account`, `container` and `blobName`).
The keys come from the consumer's connector. See [Cloud storage](/user-guide/cloud-storage).

## Discovery and exchanges

| Endpoint                                                           | Purpose                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `POST /api/exchange/negotiate`                                     | Starts a contract negotiation for an offer                                    |
| `POST /api/exchange/negotiations/<connector>/<negotiation>/cancel` | Cancels a negotiation that has not finished, on either side                   |
| `POST /api/exchange/transfers/start`                               | Starts a transfer under an agreement                                          |
| `GET /api/exchange/agreements`                                     | Lists the organization's agreements                                           |
| `GET /api/exchange/transfers`                                      | Lists the organization's transfers                                            |
| `POST /api/exchange/agreements/<connector>/<agreement>/revoke`     | Revokes an agreement as provider, with an optional body `{ "reason": "..." }` |
| `POST /api/exchange/agreements/<connector>/<agreement>/restore`    | Restores a revoked agreement as provider                                      |
| `POST /api/exchange/transfers/<connector>/<transfer>/edr`          | Returns a current access token for repeated downloads as consumer             |
| `POST /api/exchange/transfers/<connector>/<transfer>/suspend`      | Suspends a running transfer on either side. `resume` and `terminate` work the same way |

- **Provider view**: by default, the agreement and transfer lists show exchanges in which your
  organization is the consumer. With `role=provider`, they list the agreements and transfers of
  data it shares. The consumer is then in `partner`, and `retired` is set for revoked agreements.
- **Permissions**: these actions require the Manager role on the connector. Revoking and restoring
  only work on the provider's own connector.
- **Paging**: agreements and transfers come in pages of 20, 50 or 100 entries per connector.
  New records can shift page boundaries.

## Connector data export and import

Connector Managers can download a connector's data and import it into another compatible
connector, either on the connector page or with these routes:

| Route                                           | Contents and behavior                                                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/connectors/:id/export-data`           | Products, policies, offers, connector identity metadata, negotiations, agreements and sent and received transfers                                                                 |
| `POST /api/connectors/:id/import-data`          | Body `{ "data": <download JSON>, "publishOffers": false }`. Creates the configuration with new IDs and returns counts, skipped exchange records and warnings                      |
| `GET /api/connectors/:id/export-configuration`  | Products, policies and offers only                                                                                                                                               |
| `POST /api/connectors/:id/import-configuration` | Body `{ "configuration": <export JSON>, "publishOffers": false }`. Imports the configuration only                                                                                 |

- **Requirements**: the connector must be running or degraded and reachable, and a self-hosted
  connector's agent must be online.
- **Excluded data**: credentials, secrets, tokens, private keys and source data are never
  included. Source credentials must therefore be entered again, and policies reviewed, before
  imported offers are published.
- **Import behavior**: imports create new resource IDs, keep existing resources and skip offers
  unless `publishOffers` is true. A failed import removes what that attempt created.
- **Exchange history**: included for reference only, because it cannot be recreated on a
  connector.
- **Limits**: the configuration part is limited to 5 million characters, 1,000 products, 2,000
  policies and 1,000 offers.

## Organizations

| Endpoint                                                          | Purpose                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `POST /api/organizations/:id/offboard`                            | Offboards an organization (platform administrator), withdrawing its offers, removing its connectors and suspending access |
| `GET /api/account/invitations`                                    | Lists the invitations of the signed-in account                                              |
| `POST /api/account/invitations/:id/accept`, `.../decline`         | Accepts or declines an invitation                                                           |
