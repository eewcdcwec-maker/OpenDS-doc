---
id: exchange
title: Discover and exchange data
---

# Discover and exchange data

## Discover

Open **Discover**. Search by product name, topic, tag or category, or filter by provider
organization. Discover has two views:

- **Data products**: offers providers have published on listed connectors. Choose your consumer
  connector for requests, then **Search**.
- **Live catalog**: a request to a provider's running connector, which returns only the offers
  its access policies allow for you. If you know a provider's connector but it is not listed,
  select **The provider is not listed** and enter its DSP address and DID (or BPN). Ask the
  provider for the address.

Credentials and private source configuration never appear in discovery results.

## Get an agreement

Choose a consumer connector and an offer, then:

- If the offer shows **Provider approval**, select **Request access**. The provider approves or
  rejects it under **Access requests**. Approval concludes the agreement for you; after a
  rejection you can **Request again**.
- Otherwise select **Request agreement**; it works if you are eligible under the access policy.

The app then opens **Agreements**, where the new agreement appears as **Agreed** once the
connectors have concluded it, usually within seconds. Start transfers from there. You can cancel a negotiation that has not finished. A
finished negotiation is an agreement; its details show the terms you accepted.

## Transfer data

Start a transfer from an agreement (**Start transfer** under **Agreements**) and choose the
transfer type:

| Transfer type  | How it works                                                                        |
| -------------- | ----------------------------------------------------------------------------------- |
| Pull           | You fetch the data from the provider's connector with a short-lived token           |
| Push to HTTP   | The provider's connector sends the data to your HTTP endpoint using POST             |
| Push to S3     | The provider's connector writes to a bucket of your connector's cloud storage       |
| Push to Azure  | The provider's connector writes to a container of your connector's cloud storage    |

After starting a pull transfer, open **Access details** under **Transfers**. It shows the
endpoint, token and expiry, with curl and Python examples for one-time and repeated downloads:

- **Fetch the data once** uses the current token. **Get a new token** gives a fresh one.
- **Fetch it repeatedly** is a script that asks OpenDS for current access details before every
  download. Downloads still require a valid API key, agreement and transfer. Create an API key
  under **API access** and set
  `OPENDS_API_KEY` to it before running the script.

For **Push to HTTP**, enter your endpoint URL, plus an auth header name and value if your
endpoint needs one. The endpoint must be reachable from the provider's connector. The auth
header goes to the provider's connector for this transfer only and OpenDS does not store it.

Push to S3 or Azure needs cloud storage on **your** connector; you enter only the bucket and
object name (or account, container and blob). Your connector's configured cloud-storage
credentials are used, and the
provider only gets short-lived write access for that transfer.

Progress and results appear under **Transfers**, where you can also suspend or terminate a
transfer.

## As a provider: see and control use

The **Consumers** page shows the agreements and transfers for data you share, with each
consumer's name, read live from your connectors.

- **Revoke an agreement**: new transfers are refused and running ones are terminated. **Restore**
  lets the consumer transfer under it again. An optional reason is kept on your connector. The
  revocation is recorded on your connector only: the consumer still sees the agreement as
  **Agreed**, but OpenDS requests termination of its running transfers.
- **Suspend, resume or terminate** a transfer. Suspending is a pause: either side can resume it,
  the consumer too. To prevent further transfers under this agreement, terminate the transfer or
  revoke the agreement.
- **Review access requests** under **Access requests** if you use provider approval: approve or
  reject each pending request. Owners, administrators and the Managers of the connector that
  publishes the offer decide; they also get the notification email. Each row shows the
  product, the other organization, and whether you received the request or sent it. Access requests must be on under **Organization**,
  **Organization settings**; they cannot be turned off while an offer that needs approval is
  active.

Revocation stops further delivery; it cannot take back data already received.
