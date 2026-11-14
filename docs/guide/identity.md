---
id: identity
title: Identity
---

# Identity

Every organization has exactly one identity, consisting of a DID and credentials issued by the
dataspace operator. Connectors present these credentials when they negotiate, so partners know
whom they are dealing with, and all connectors of an organization share its identity.

## Identity types

| Type in the app          | Wallet                       | Accepted by        | Suitable for                                  |
| ------------------------ | ---------------------------- | ------------------ | --------------------------------------------- |
| **Test**                 | Hosted by OpenDS, disposable | Test partners only | Trying out the dataspace                      |
| **Managed identity**     | Hosted by OpenDS             | All partners       | Exchanging real data without running a wallet |
| **Self-hosted identity** | Your own domain and wallet   | All partners       | Keeping your keys on your own server          |

You choose the type when you register. Managed and self-hosted identities are production
identities, which receive their credentials from the production issuer of the dataspace, while
test credentials never satisfy a production policy.

- **Test and managed identities** are ready a few seconds after an administrator approves your
  organization.
- **Self-hosted identities** need your wallet first, as described under
  [Your own wallet](/guide/organization-wallet). An administrator then confirms that the domain
  belongs to you before credentials are issued.

Every identity type works with both platform-hosted and self-hosted connectors.

## Changing the identity

Only the organization owner can change the identity, on the **Organization** page.

| Change                          | Action                        | Effect                                                                                                                                                              |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test to managed or self-hosted  | **Leave test mode**           | The organization starts over: connectors, products, policies, offers, partner groups, agreements and transfers are deleted, while members stay. An administrator approves the new identity. |
| Managed to self-hosted, or back | **Change wallet hosting**     | The organization gets a new DID. Offers are withdrawn and connectors are removed together with their products and policies, while partner groups stay. Agreements are removed with the connectors. |
| Correct the self-hosted domain  | **Change** next to the domain | Possible only until an administrator approves the identity                                                                                                          |

Before **Change wallet hosting**, export the data of each connector under **More → Export
connector data**, so that you can import its products and policies into the new connectors.
Self-hosted connectors must be stopped on their servers first, because the change is refused
while one of them is online.

:::caution Your domain becomes part of your DID
With a self-hosted identity, the domain is part of the DID and cannot change after approval.
Contact the dataspace operator if it must change.
:::

## Rotating the STS secret

All connectors of an organization use one secret to obtain tokens from its wallet. Rotate it
under **Organization → Rotate STS secret** if it may have leaked, for example after a server
was lost. With a self-hosted identity, first run `./wallet.sh rotate-secret` in the wallet
folder and enter the secret it prints. OpenDS delivers the new secret to every connector, and
self-hosted connectors receive it through their agent within a minute.

## When an organization leaves

When an administrator offboards an organization, OpenDS immediately withdraws its DID document,
removes its directory entry and revokes its credentials, so partners stop trusting it at once.
Its members lose access, and accounts without another organization are removed.
