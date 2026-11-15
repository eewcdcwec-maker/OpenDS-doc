---
title: Discover and exchange data
---

# Discover and exchange data

## Discover

Under **Discover**, search for offers by product name, topic, tag or category, or filter by
provider organization. Two views are available:

- **Data products**: shows all offers published by providers on connectors listed in
  discovery, including offers you are not eligible to request. Each offer displays a summary of
  its access policy. Select your consumer connector for requests, then select **Search**.
- **Live catalog**: queries a provider's running connector and returns only the offers
  permitted by its access policies for your organization. If the provider's connector is not
  listed, select **The provider is not listed** and enter the DSP address and DID provided by
  the provider. Both are available on the provider's connector page.

Credentials and private source configuration are never exposed in discovery results.

## Getting an agreement

Select a consumer connector and an offer, then proceed according to the offer's approval
settings:

- **Offers requiring provider approval**: select **Request access**. The provider can approve
  or reject the request. Once approved, the connectors conclude the agreement. If the request
  is rejected, you can select **Request again**.
- **Offers without provider approval**: select **Request agreement**. The request succeeds if
  the access policy permits it.

The app then opens **Agreements**. The new agreement appears as **Agreed** once both
connectors have concluded it, usually within seconds. You can start transfers from this page or
cancel a negotiation that is still in progress. Agreement details show the terms you accepted.

## Transferring data

Under **Agreements**, select **Start transfer** and choose a transfer type:

| Transfer type | How it works                                                                      |
| ------------- | --------------------------------------------------------------------------------- |
| Pull          | You fetch the data from the provider's connector using a short-lived token        |
| Push to HTTP  | The provider's connector sends the data to your HTTP endpoint using POST          |
| Push to S3    | The provider's connector writes the data to a bucket in your connector's cloud storage |
| Push to Azure | The provider's connector writes the data to a container in your connector's cloud storage |

Pull is available only for products with an HTTP source. Products stored in S3 or Azure are
delivered using push.

- **Pull**: after starting the transfer, **Transfers** provides **Download** and **Access
  details**:
  - **Download** fetches the data directly.
  - **Access details** displays the endpoint, token and expiry time, with curl and Python
    examples.
  - **Fetch the data once** downloads the data using the current token.
  - **Get a new token** issues a fresh token.
  - **Fetch it repeatedly** provides a script that retrieves current access details before each
    download. The script reads a personal API key (created under **API access**) from the
    `OPENDS_API_KEY` environment variable.
- **Push to HTTP**: enter your endpoint URL and, if required, an authentication header name and
  value. The endpoint must be reachable from the provider's connector. The header is passed to
  the provider's connector for this transfer only and is not stored by OpenDS.
- **Push to S3 or Azure**: requires cloud storage configured on your own connector. Enter the
  bucket and object name, or the storage account, container and blob. The provider receives
  short-lived write access for this transfer only.

Transfer progress and results appear under **Transfers**. You can also suspend or terminate a
transfer there.

## Controlling use as a provider

The **Consumers** page shows the agreements and transfers associated with your shared data,
including each consumer's name.

- **Revoke an agreement**: prevents new transfers and terminates running ones. **Restore**
  allows transfers again. You can provide an optional reason, which is stored on your
  connector. The consumer continues to see the agreement as **Agreed**, because revocation is
  recorded only on your connector.
- **Suspend, resume or terminate a transfer**: suspending pauses the transfer, which either
  side can resume. Terminating ends only that transfer. The agreement remains valid, so the
  consumer can start another transfer. To prevent further transfers under an agreement, revoke
  the agreement.
- **Review access requests**: for offers requiring provider approval, review pending requests
  under **Access requests** and approve or reject them. Organization owners, administrators and
  Managers of the publishing connector can make these decisions and receive notification
  emails. Access requests must be enabled under **Organization → Organization settings** and
  cannot be disabled while an offer requiring approval is active.

Revocation prevents further delivery, but data already received by a consumer cannot be
retrieved.
