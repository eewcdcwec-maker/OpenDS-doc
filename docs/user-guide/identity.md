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

Only the organization owner can change the identity from the **Organization** page. There are
three kinds of change.

### Leave test mode

Use **Leave test mode** to switch from a test identity to a managed or self-hosted identity.
This resets the organization: connectors, products, policies, offers, partner groups,
agreements and transfers are deleted. Members remain. Partner groups of other organizations
that include this one must be updated, and a platform administrator must approve the new
identity.

Before leaving test mode, you can export each connector's data under **More → Export connector
data**. Export the data while the connectors are still running, because leaving test mode
deletes them.

Importing the exported data restores products and policies. Offers are restored only if
**Publish imported offers immediately** is selected. Agreements and transfers are not
imported.

Offers for products with source authentication must be published again with their secrets,
because secrets are never included in exports.

### Change wallet hosting

Use **Change wallet hosting** to switch between a managed and a self-hosted identity. The
organization receives a new DID, and its existing offers are withdrawn. Connectors are removed
together with their products, policies and agreements.

The organization's own partner groups remain, but other partners must add the organization to
their groups again because those groups reference its previous identity.

Before changing wallet hosting, export each connector's data under **More → Export connector
data**. You can then import the products and policies into the new connectors.

Self-hosted connectors must be stopped on their servers before the change. The operation is
refused while any self-hosted connector is online.

### Correct the self-hosted domain

Select **Change** next to the domain on the **Organization** page. You can do this only before
a platform administrator approves the identity.

:::caution[Your domain becomes part of your DID]
For a self-hosted identity, the domain is part of the DID and cannot be changed after
approval. Contact the platform administrator if you need to change it.
:::

## Rotating the STS secret

All connectors belonging to an organization use the same secret to obtain tokens from its
wallet. Rotate this secret if it may have been compromised, for example after losing a server.

To rotate the secret, go to **Organization → Rotate STS secret** and start the rotation.

With a self-hosted identity, first run `./wallet.sh rotate-secret` in the wallet directory.
The command prints a new secret. Enter it in the **New secret from your wallet** field when
you start the rotation in OpenDS.

OpenDS distributes the new secret to all the organization's connectors. Self-hosted connectors
receive it through their agents within one minute.

## When an organization is offboarded

When a platform administrator offboards an organization, OpenDS immediately withdraws its DID
document, removes its directory entry and revokes its credentials. Partners therefore stop
trusting the organization's identity. Its members lose access to OpenDS, and accounts that do
not belong to another organization are removed.
