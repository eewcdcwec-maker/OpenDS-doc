---
id: two-host-test
title: Two-host integration test
---

# Two-host integration test

`scripts/two-host-identity-e2e.mjs` checks that an organization on another server can join an
OpenDS dataspace and exchange data with an organization OpenDS hosts. It covers the production
issuer, administrator approval, HTTPS `did:web` resolution, the BDRS directory and DSP between
independent hosts.

|              | OpenDS server                    | Second server                                               |
| ------------ | -------------------------------- | ----------------------------------------------------------- |
| Organization | "Org A", wallet hosted by OpenDS | "Org B"                                                     |
| Wallet       | OpenDS IdentityHub               | Hosted by OpenDS, or its own (`OPENDS_TWO_HOST_WALLET=own`) |
| Connectors   | Hosted by OpenDS                 | Two self-hosted connectors behind one shared HTTPS entry    |
| Credentials  | OpenDS production issuer         | OpenDS production issuer                                    |

The test registers and approves both organizations, exchanges data in both directions,
offboards Org B, and removes the resources it created on the second server.

## Requirements

- OpenDS installed with `PUBLIC_DOMAIN`, so that the production issuer exists.
- A second Linux server with Docker, reachable over SSH from the OpenDS server, with inbound
  TCP port 443.
- For `OPENDS_TWO_HOST_WALLET=own`, an issuer that can reach the organization's wallet. Allow
  a private second server with `ORGANIZATION_PRIVATE_NETWORKS`
  ([Configuration](/administration/configuration#private-networks)); a separate identity host
  cannot reach a private wallet.

## Run the test

```bash
OPENDS_TWO_HOST_SSH=user@second-server OPENDS_TWO_HOST_HOST=<second-server-ip> \
  NODE_EXTRA_CA_CERTS=.deploy/ca/dataspace-ca.crt node scripts/two-host-identity-e2e.mjs
```

Set `OPENDS_TWO_HOST_KEEP=1` to keep organizations and containers for inspection. With an own
wallet, `OPENDS_TWO_HOST_SWITCH=1` also moves Org B's wallet to OpenDS and back. That switch is
refused while Org B's self-hosted connectors are online.

The test uses `sslip.io` names built from the second server's IP address. To use a stable wallet
hostname instead, set `OPENDS_TWO_HOST_WALLET_DOMAIN=wallet.example.org` and point its A record
at the second server.

For a manual setup, use [Your own wallet](/guide/organization-wallet) and create
a self-hosted connector from the app.
