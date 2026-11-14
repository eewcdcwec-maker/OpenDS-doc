---
title: Discover and exchange data
---

# Discover and exchange data

## Discover

Under **Discover**, you can search by product name, topic, tag or category, or filter by
provider organization. Discover offers two views:

- **Data products**: the offers that providers have published on listed connectors. Choose your
  consumer connector for requests, then select **Search**.
- **Live catalog**: a request to a provider's running connector, which returns only the offers
  its access policies allow for you. If a provider's connector is not listed, select **The
  provider is not listed** and enter the DSP address and DID that the provider gives you.

Credentials and private source configuration never appear in discovery results.

## Getting an agreement

Choose a consumer connector and an offer, then:

- **Offers with provider approval**: select **Request access**. The provider approves or rejects
  the request. An approval concludes the agreement for you. After a rejection, you can
  select **Request again**.
- **All other offers**: select **Request agreement**, which succeeds if the access policy allows
  you.

The app then opens **Agreements**. The new agreement appears as **Agreed** once the connectors
have concluded it, usually within seconds. You start transfers from there, and you can cancel a
negotiation that has not finished. The details of an agreement show the terms
you accepted.

## Transferring data

Start a transfer with **Start transfer** under **Agreements** and choose the transfer type:

| Transfer type | How it works                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| Pull          | You fetch the data from the provider's connector with a short-lived token        |
| Push to HTTP  | The provider's connector sends the data to your HTTP endpoint with POST          |
| Push to S3    | The provider's connector writes to a bucket of your connector's cloud storage    |
| Push to Azure | The provider's connector writes to a container of your connector's cloud storage |

- **Pull**: after starting the transfer, open **Access details** under **Transfers**. It shows
  the endpoint, token and expiry, with curl and Python examples. **Fetch the data once** uses
  the current token, and **Get a new token** issues a fresh one. **Fetch it repeatedly** is a
  script that requests current access details before every download. It reads a personal API
  key (from **API access**) from the environment variable `OPENDS_API_KEY`.
- **Push to HTTP**: enter your endpoint URL and, if needed, an authentication header name and
  value. The endpoint must be reachable from the provider's connector. The header is passed to
  the provider's connector for this transfer only and is not stored by OpenDS.
- **Push to S3 or Azure**: requires cloud storage on your own connector. You only enter the
  bucket and object name, or the account, container and blob. The provider receives
  short-lived write access for this transfer only.

Progress and results appear under **Transfers**, where you can also suspend or terminate a
transfer.

## Controlling use as a provider

The **Consumers** page shows the agreements and transfers for the data you share, together with
each consumer's name.

- **Revoke an agreement**: new transfers are refused and running ones are terminated.
  **Restore** allows transfers again. An optional reason is kept on your connector. The
  consumer still sees the agreement as **Agreed**, because the revocation is recorded on your
  connector only.
- **Suspend, resume or terminate a transfer**: suspending is a pause that either side can
  resume. To prevent further transfers under an agreement, terminate the transfer or revoke the
  agreement.
- **Review access requests**: for offers with provider approval, approve or reject each pending
  request under **Access requests**. Owners, administrators and the Managers of the publishing
  connector decide and receive the notification email. Access requests must be enabled under
  **Organization → Organization settings** and cannot be disabled while an offer that requires
  approval is active.

Revocation stops further delivery, but data that has already been received cannot be taken
back.
