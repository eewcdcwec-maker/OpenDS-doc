---
title: Identity
---

# Identity

Each organization has a single identity, comprising a DID (decentralized identifier) and
credentials issued by the dataspace operator. All connectors belonging to that organization
share this identity and present its credentials during negotiations, allowing other
participants to verify the organization's identity.

## Identity types

| Type in the app          | Wallet                                                            | Accepted by                | Suitable for                                         |
| ------------------------ | ----------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| **Test**                 | Hosted by OpenDS and disposable                                   | Other test identities only | Evaluation and testing                               |
| **Managed identity**     | Hosted by OpenDS                                                  | All partners               | Exchanging real data without operating your own wallet |
| **Self-hosted identity** | Hosted on your own infrastructure and associated with your domain | All partners               | Keeping your identity keys under your own control    |

You choose the identity type when registering your organization. Managed and self-hosted
identities are production identities and receive credentials from the production issuer of the
dataspace. Test identities receive credentials from a separate test issuer and can exchange
data only with other test identities.

- **Test and managed identities** are ready within a few seconds after a platform
  administrator approves your organization.
- **Self-hosted identities** require you to set up your wallet first, as described under
  [Self-hosted wallet](/self-hosting/self-hosted-wallet). A platform administrator then
  verifies domain ownership before the production issuer issues your credentials.

All identity types work with both platform-hosted and self-hosted connectors.

## Changing the identity

Only the organization owner can change the identity, on the **Organization** page. There are
three kinds of change.

### Leave test mode

Use **Leave test mode** to move from a test identity to a managed or self-hosted identity. The
organization starts over: connectors, products, policies, offers, partner groups, agreements
and transfers are deleted. Members stay. A platform administrator approves the new identity.

You can export the data of each connector first, under **More → Export connector data**. Do it
while the connectors are still running, because leaving test mode deletes them. An import
brings back products and policies, and offers only when **Publish imported offers
immediately** is selected. Agreements and transfers are not imported, and partner groups that
name test identities must be updated. Offers of products with source authentication must be
published again with their secret, because secrets are never exported.

### Change wallet hosting

Use **Change wallet hosting** to move from a managed to a self-hosted identity, or back. The
organization gets a new DID. Offers are withdrawn. Connectors are removed together with their
products, policies and agreements. The organization's own partner groups stay, but partners
must add it to their groups again, because those name its old identity.

Before the change, export the data of each connector under **More → Export connector data**,
so that you can import its products and policies into the new connectors. Self-hosted
connectors must be stopped on their servers first, because the change is refused while one of
them is online.

### Correct the self-hosted domain

Select **Change** next to the domain on the **Organization** page. This is possible only until
a platform administrator approves the identity.

:::caution[Your domain becomes part of your DID]
With a self-hosted identity, the domain is part of the DID and cannot change after approval.
Contact the platform administrator if it must change.
:::

## Rotating the STS secret

All connectors of an organization use one secret to obtain tokens from its wallet. Rotate it
if it may have leaked, for example after a server was lost.

1. With a self-hosted identity, first run `./wallet.sh rotate-secret` in the wallet folder.
   It prints a new secret.
2. Under **Organization → Rotate STS secret**, start the rotation. With a self-hosted
   identity, enter the secret from step 1 in the **New secret from your wallet** field.

OpenDS delivers the new secret to every connector. Self-hosted connectors receive it through
their agent within a minute.

## When an organization is offboarded

When a platform administrator offboards an organization, OpenDS immediately withdraws its
DID document, removes its directory entry and revokes its credentials, so partners stop
trusting it at once.
Its members lose access, and accounts without another organization are removed.
