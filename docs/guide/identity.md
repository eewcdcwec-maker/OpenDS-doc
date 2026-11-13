---
id: identity
title: Identity
---

# Identity

Every organization has exactly one identity: a DID (its name in the dataspace), a BPN (its
partner number) and credentials issued by the dataspace operator. Connectors present these
credentials when they negotiate, so partners know who they deal with. All of an
organization's connectors share its identity.

## Choose a type

| Type in the app          | Wallet                         | Partners accept it | Good for                                    |
| ------------------------ | ------------------------------ | ------------------ | ------------------------------------------- |
| **Test**                 | Hosted by OpenDS, disposable   | Test partners only | Trying the dataspace                        |
| **Managed identity**     | Hosted by OpenDS               | Yes                | Exchanging real data without running a wallet |
| **Self-hosted identity** | Your own domain and wallet     | Yes                | Keeping your keys on your own server        |

You choose the type when you register. Managed and self-hosted identities are the
production identities: the dataspace's production issuer credentials them, and test
credentials never pass a production policy.

- **Test** and **managed** identities are ready a few seconds after an administrator approves
  your organization.
- A **self-hosted** identity needs your wallet first: follow
  [Your own wallet](/guide/organization-wallet). An administrator then confirms that the
  domain belongs to you before credentials are issued.

The identity type and hosting are independent of where your connectors run: every type works
with platform-hosted and self-hosted connectors.

## Change it

Only the organization owner can change the identity, on the **Organization** page.

| Change                                | How                          | What happens                                                                                     |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Test to managed or self-hosted        | **Leave test mode**          | Starts over: connectors, products, policies, offers, partner groups, agreements and transfers are deleted; members stay. An administrator approves the new identity. |
| Managed to self-hosted, or back       | **Change wallet hosting**    | New DID. Offers are withdrawn and connectors removed, with the products and policies on them; partner groups stay. Agreements go with the connectors. |
| Correct the self-hosted domain        | **Change** next to the domain | Possible only until an administrator approves the identity.                                     |

Before **Change wallet hosting**, export each connector's data (**More → Export connector
data**) so you can import its products and policies into the new connectors. Stop
self-hosted connectors on their servers first; the switch is refused while one is online.

:::caution Your domain becomes part of your DID
With a self-hosted identity, the domain is in the DID itself. After approval it cannot change;
contact the dataspace operator if it must.
:::

## Rotate the STS secret

All your connectors use one secret to get tokens from your wallet. Rotate it if it may have
leaked, for example when a server was lost: **Organization → Rotate STS secret**. With a
self-hosted identity, first run `./wallet.sh rotate-secret` in the wallet folder and enter
the secret it prints. OpenDS delivers the new secret to every connector; self-hosted ones get
it through their agent within a minute.

## When an organization leaves

When an administrator offboards an organization, OpenDS withdraws its DID document at once,
removes its directory entry and revokes its credentials, so partners stop trusting it
immediately. Its members lose access; accounts without another organization are removed.
