---
title: Installation
---

# Installation

OpenDS is installed on a Linux server with Docker Compose. A single setup command creates the
platform services, the connector cluster and the identity services.

## Requirements

- The server runs Linux on x86_64 with Docker Engine, Compose v2, Git, Bash, curl, tar and
  sha256sum. Node.js is not required for the Docker installation.
- An evaluation installation with up to two platform-hosted connectors needs at least 4 CPU
  cores, 8 GB RAM and 20 GB of free disk space. Actual use depends on the connector workload,
  image caches and retained data.
- To make the platform reachable over HTTPS from the internet, the server needs a domain name
  that points to its IP address and an open TCP port 443.
- During installation, the server needs outbound internet access to fetch the OpenDS source
  from GitHub, container images from the registries, and the Kubernetes and Helm tooling.
- Setup runs as a regular user who has Docker access. If `docker ps` reports "permission
  denied", add the user to the `docker` group with `sudo usermod -aG docker $USER`, then log
  out and back in.
- The connector cluster needs higher system limits for file watching than most Linux
  distributions set by default. If the setup user can run `sudo`, setup raises them
  automatically. Otherwise, an administrator should set them once with the following command,
  which also keeps them after a reboot:

  ```bash
  printf 'fs.inotify.max_user_instances=8192\nfs.inotify.max_user_watches=1048576\n' \
    | sudo tee /etc/sysctl.d/99-opends.conf && sudo sysctl --system
  ```

## Choose an installation option

The installation options differ in how the platform is reached and secured. You select one with
`EDGE_TLS` and `PUBLIC_DOMAIN` in `.env` during installation:

| #   | Option                 | `EDGE_TLS`  | Use it when                                                    | Result                                   |
| --- | ---------------------- | ----------- | -------------------------------------------------------------- | ---------------------------------------- |
| 1   | Internet with a domain | `acme`      | The server is on the internet with a domain                    | HTTPS with Let's Encrypt                 |
| 2   | Private network        | `internal`  | The server is on a private network where clients can trust the dataspace CA | HTTPS with dataspace-issued certificates |
| 3   | Your own certificate   | `files`     | You already have a certificate for the domain                  | HTTPS with your certificate              |
| 4   | HTTP evaluation        | not set     | You only want to try OpenDS on a trusted network               | Plain HTTP, test identities only         |

Each option is described below with the lines it needs in `.env`. You enter them in the
[Install](#install) section.

### Option 1: Internet with a domain

Use this option when the server is reachable from the internet and has a domain name that points
to it. OpenDS obtains and renews a Let's Encrypt certificate automatically.

```bash
PUBLIC_DOMAIN=dataspace.example.org
EDGE_TLS=acme
```

### Option 2: Private network

Use this option when the server is only reachable inside a private network. OpenDS issues the
certificates itself with the dataspace CA, so every browser and script client must trust that
CA. After setup, its certificate is stored on the server in `.deploy/ca/dataspace-ca.crt`. Copy
it to your computer and add it as described in
[Trusting the dataspace CA](/administration/configuration#trusting-the-dataspace-ca).

```bash
PUBLIC_DOMAIN=opends.example.internal
EDGE_TLS=internal
```

If you have no DNS record for the server, you can use an address-based hostname from `sslip.io`
instead:

```bash
PUBLIC_DOMAIN=opends.192-168-1-50.sslip.io   # for a server at 192.168.1.50
EDGE_TLS=internal
```

### Option 3: Your own certificate

Use this option when you have a certificate for the domain, for example from a company CA, or
when Let's Encrypt is not an option. `PUBLIC_DOMAIN` must be the name the certificate is issued
for, otherwise browsers show a warning.

```bash
PUBLIC_DOMAIN=dataspace.example.org
EDGE_TLS=files
```

Before you run setup, place the certificate chain in `.deploy/edge-certs/tls.crt` and the
private key in `.deploy/edge-certs/tls.key`.

### Option 4: HTTP evaluation

Use this option only to try OpenDS quickly. Leave `PUBLIC_DOMAIN` empty and set `PUBLIC_HOST` to
the server's IP address. The app then runs over plain HTTP at `http://<PUBLIC_HOST>:8081`.

```bash
PUBLIC_DOMAIN=
PUBLIC_HOST=192.168.1.50
```

:::danger[Unencrypted]
HTTP evaluation supports test identities only. Login details, tokens and data sent over its
endpoints are not encrypted. Use it only on a trusted network. For HTTPS on a private network,
use option 2 instead.
:::

## Install

Clone the repository and create `.env` from the example:

```bash
git clone https://github.com/kwe712/OpenDS.git opends && cd opends
cp .env.example .env
```

In the first section of `.env`, enter the lines for your chosen option (1 to 4) and set the first
administrator:

```bash
PUBLIC_DOMAIN=dataspace.example.org   # your domain; changing it later resets identities
EDGE_TLS=acme                         # acme, internal or files, as described above
PAYLOAD_ADMIN_EMAIL=you@example.org   # the first administrator; a real mailbox
```

:::warning[Choose your domain before organizations join]
The domain is part of the issuer DID and the DIDs of all test and managed identities. Changing
it later does not require a new installation, but it invalidates the existing identities
associated with the previous domain.

1. When you run setup again with the new domain, it stops with a "created for another
   address" error.
2. You remove the affected identity stack with the command that the error names.
3. Running setup again then creates new identity services for the new domain, and the
   identities start over:
   - **Test identities** are reset.
   - **Production identities** and their keys are deleted. Every production organization sets
     up its identity again, and self-hosted wallets request their credentials again.

For an installation you intend to keep, use a stable hostname. Address-based `sslip.io` names
change whenever the server's IP address changes, which counts as a domain change.
:::

Start the setup:

```bash
bash manage.sh setup
```

Setup generates any missing secrets and may take several minutes, depending on image
downloads and server resources. When it finishes, it prints:

```text
OpenDS is ready: https://<your domain>
```

With option 4, the address is `http://<PUBLIC_HOST>:8081` instead.

With option 2 (`EDGE_TLS=internal`), first trust the dataspace CA as described there. Then open that
address and sign in with the email and password from `PAYLOAD_ADMIN_EMAIL` and
`PAYLOAD_ADMIN_PASSWORD` in `.env`. If you left the password empty, setup generated one.

You can run setup again later. It keeps your settings and data and rebuilds the platform
images, which needs about 3 GB of free disk space. If the code has not changed since the last
run, add `--skip-build` to reuse the existing images.

## After installation

1. Open **Platform Admin** from the account menu and configure email, registration and backups.
2. Try a first exchange between two organizations, as described in
   [Your first data exchange](/getting-started/first-data-exchange).

Optional and advanced settings are listed in `.env.example`, commented out with their
defaults, and explained under [Configuration](/administration/configuration). Everyday
commands, backups and updates are described under [Operations](/administration/operations).
