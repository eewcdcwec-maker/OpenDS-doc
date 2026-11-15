---
title: Identity services
---

# Identity services

This page is for operators. It describes where the identity services of a dataspace run and how
to move them to a separate host. Organizations choose and change their identity as described
under [Identity](/user-guide/identity).

The production identity services form one **identity stack**, consisting of the production
issuer, one wallet service for all organizations with a managed identity, the production
directory, and their own Vault and PostgreSQL. Test identities have a separate test stack, which
always runs on the OpenDS server. This way, an installation without a domain is complete on its
own, and test participants never appear in the production directory. Both stacks run in Docker
Compose with the official Tractus-X images.

## Choosing the domain

The DIDs of the production issuer and of every managed identity contain the identity domain.
The issuer is also named in every credential. Therefore, **changing the domain later
invalidates all production identities and credentials**. Organizations with a managed identity
receive new identities, while organizations with a self-hosted identity must request their
credentials again.

Choose a domain that you intend to keep before approving the first production organization.
Use a stable name such as `dataspace.example.org` or `id.example.org`, rather than an
address-based name.

## Layouts

The issuer delivers credentials to each organization's wallet. Participants resolve DIDs and
call wallet endpoints, so these services must be reachable by all participants through stable
HTTPS addresses.

- **Local stack (default)**: runs on the OpenDS server behind the platform's own HTTPS entry.
  Use it when the OpenDS server is reachable by all participants, either with a public domain or
  on a private network where everyone trusts the dataspace CA.
- **Separate host**: runs on another server, for example a small public server, while the
  platform stays on a private network. Use it when the OpenDS server must stay private but
  participants are on the internet.

| Component                                    | Runs on                                       | Reachable from                                                 |
| -------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| Platform                                     | OpenDS server                                 | Users and administrators                                       |
| Test identity stack                          | OpenDS server                                 | Organizations with a test identity                              |
| Production identity stack                    | OpenDS server (default) or a separate host    | All participants over HTTPS, management only from the platform |
| Platform-hosted connectors                   | Kubernetes, locally or in a remote cluster    | Participants over HTTPS                                        |
| Self-hosted connectors and wallets           | Servers operated by the organizations         | As chosen by the organization                                  |

Only DID documents, the wallet and token endpoints, credential requests, revocation lists and
the directory are public. All management APIs, the Vaults and the databases stay private.

## DIDs

| Identity                     | Local stack                             | Separate host                           |
| ---------------------------- | --------------------------------------- | --------------------------------------- |
| Production issuer            | `did:web:<domain>:api:dataspace:issuer` | `did:web:<identity host>:opends:issuer` |
| Managed identity             | `did:web:<domain>:api:identities:<id>`  | `did:web:<identity host>:opends:<id>`   |
| Self-hosted identity         | `did:web:<its own domain>`              | `did:web:<its own domain>`              |

`<id>` is the identity's ID in OpenDS. Test identities always use the domain of the OpenDS
server.

## Separate host

A separate identity host requires:

- A Linux server with Docker.
- An SSH user with `sudo` privileges.
- TCP ports 80 and 443 open to the internet.
- A DNS name pointing to the server.

A server with 2 vCPUs, 4 GB RAM and swap enabled is sufficient.

After `bash manage.sh setup` has finished, run the following command on the OpenDS server.
Replace the SSH user, server address and DNS name with those of your identity host:

```bash
bash scripts/identity-host-install.sh opends@203.0.113.20 id.example.org
```

The script can be run again to update the stack. It:

- **Installs the stack** under the SSH user's `~/opends`, with a Let's Encrypt certificate for
  the host name.
- **Hardens SSH** and, on Debian-based hosts, installs `fail2ban` and automatic security
  updates. Docker itself is updated by hand, because an update restarts the stack. Turning off
  SSH password logins is recommended once every administrator logs in with a key.
- **Links the OpenDS server to the host** over SSH. The OpenDS server connects out, so it needs
  no inbound access. The management APIs stay on the host's loopback interface and are only
  reachable through this link.
- **Includes the host in the platform backups** by fetching its database and Vault state with a
  separate, restricted key.

A self-hosted wallet must be reachable from the identity host, because the issuer delivers
credentials to it. A public identity host cannot reach wallets on a private network.
Organizations in that situation must use a managed identity.

## Rebuilding a lost identity host

If the identity host is lost or has to be set up again, install a new one with the same host
name, so that the production DIDs stay the same:

1. Point the host name at the new server, or keep the old server and wipe it.
2. On the OpenDS server, run the installer again:

   ```bash
   bash scripts/identity-host-install.sh opends@203.0.113.20 id.example.org
   ```

   A server without the stack receives a new production issuer, new Vault keys and empty
   wallets. The installer links the OpenDS server to it as before.

3. Under **Platform Admin → Operations**, select **Check now**. The **Organization identities**
   check lists each organization with a managed identity whose wallet is missing. Those
   organizations see an **Identity setup needs attention** notice.
4. The owners of those organizations select **Retry** on the **Organization** page. OpenDS then
   sets the identity up again with the same DID.
5. Organizations with a self-hosted identity keep their own wallets. Their credentials were
   signed by the old issuer, so they request their credentials again from their wallet.

Platform backups contain the identity host's database and Vault for manual recovery only.
`backup restore` does not restore them onto an identity host. Rebuilding as described above is
the supported path.
