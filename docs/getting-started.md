---
id: getting-started
title: Installation
---

# Installation

Install OpenDS on a Linux server using Docker Compose.

## Requirements

- For an evaluation installation with up to two platform-hosted connectors, plan for at least
  4 CPU cores, 8 GB RAM and 20 GB free disk. Actual use depends on connector workload, image
  caches and retained data. Self-hosted connector runtimes use their organizations' hosts; the
  platform still handles management, discovery and agent requests.
- For HTTPS on the internet: a domain pointing at the server, with TCP 443 open.
- A Linux x86_64 server with Docker Engine, Compose v2, Git, Bash, curl, tar and sha256sum.
  Node.js is not required for the Docker installation.
- Outbound access to GitHub, container registries and the Kubernetes and Helm downloads.
- Run setup as a regular user with Docker access. If `docker ps` says "permission denied", add
  the user to the `docker` group and log in
  again: `sudo usermod -aG docker $USER`.
- Two kernel limits for the connector cluster. Setup raises them itself when it may use
  `sudo`; otherwise set them once as root, so they also survive a reboot:

  ```bash
  printf 'fs.inotify.max_user_instances=8192\nfs.inotify.max_user_watches=1048576\n' \
    | sudo tee /etc/sysctl.d/99-opends.conf && sudo sysctl --system
  ```

## Choose a TLS mode

| `EDGE_TLS`  | Use it when                                                    | Result                                          |
| ----------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `acme`      | The server is on the internet with a domain                    | HTTPS with Let's Encrypt                        |
| `internal`  | A private network where clients can trust the dataspace CA     | HTTPS with dataspace-issued certificates         |
| `files`     | You provide certificate files before setup                     | HTTPS with your certificate                     |

With `EDGE_TLS=internal`, configure each browser and script client to trust the dataspace CA.
Its certificate is on the server in `.deploy/ca/dataspace-ca.crt` after setup: copy it to your
computer and add it as described in
[trusting the dataspace CA](/administration/configuration#trusting-the-dataspace-ca).

### HTTP evaluation mode

Leave `PUBLIC_DOMAIN` empty and set `PUBLIC_HOST` to the server's IP address. The app is then at
`http://<PUBLIC_HOST>:8081`.

:::danger Unencrypted
HTTP evaluation mode supports test identities only. Login details, tokens and data sent over
its HTTP endpoints are unencrypted. Use it on a trusted network only. For HTTPS on a private
network, set a hostname in `PUBLIC_DOMAIN` and use `EDGE_TLS=internal`.
:::

## Install

```bash
git clone https://github.com/kwe712/OpenDS.git opends && cd opends
cp .env.example .env
```

Fill in the first section of `.env`:

```bash
PUBLIC_DOMAIN=dataspace.example.org   # your domain; choose it once
EDGE_TLS=acme                         # acme (internet), internal (private network) or files
PAYLOAD_ADMIN_EMAIL=you@example.org   # the first administrator; a real mailbox
```

On a private network, you can use an address-based hostname supplied by `sslip.io` instead of
creating your own DNS record:

```bash
PUBLIC_DOMAIN=opends.192-168-1-50.sslip.io   # for a server at 192.168.1.50
EDGE_TLS=internal
```

Then run setup:

```bash
bash manage.sh setup
```

Setup creates the platform services, connector cluster and identity services and generates
missing secrets. It may take several minutes, depending on image downloads and server
resources. On success, it prints:

```text
OpenDS is ready: https://<your domain>
```

Open that address and sign in with `PAYLOAD_ADMIN_EMAIL` and `PAYLOAD_ADMIN_PASSWORD` from
`.env`. With `EDGE_TLS=internal`, trust the dataspace CA first (see above).

Rerunning setup keeps your settings and data.

:::warning Choose your domain once
Changing the local issuer's domain changes its DID and requires credentials to be reissued.
Test identities are tied to it too: after a change, setup stops and names the command that
removes the test identity stack before you run it again. Use a stable hostname for an
installation you intend to keep; address-based hostnames change when the embedded IP changes.
:::

## After installation

1. Sign in as the first administrator.
2. Open **Platform Admin** from the account menu and configure email, registration and backups.
3. Try a first exchange between two organizations:
   [Your first data exchange](/guide/first-exchange).

Optional and advanced settings are listed in `.env.example`, commented out with their defaults.
See [Configuration](/administration/configuration). Everyday commands, backups and updates:
see [Operations](/administration/operations).
