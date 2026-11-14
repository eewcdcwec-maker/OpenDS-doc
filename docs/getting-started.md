---
id: getting-started
title: Installation
---

# Installation

OpenDS is installed on a Linux server with Docker Compose. A single setup command creates the
platform services, the connector cluster and the identity services.

## Requirements

- An evaluation installation with up to two platform-hosted connectors needs at least 4 CPU
  cores, 8 GB RAM and 20 GB of free disk space. Actual use depends on the connector workload,
  image caches and retained data. Self-hosted connectors run on their organizations' own
  servers, while the platform still handles their management, discovery and agent requests.
- HTTPS on the internet requires a domain that points at the server, with TCP port 443 open.
- The server runs Linux on x86_64 with Docker Engine, Compose v2, Git, Bash, curl, tar and
  sha256sum. Node.js is not required for the Docker installation.
- The server needs outbound access to GitHub, the container registries and the Kubernetes and
  Helm downloads.
- Setup runs as a regular user with Docker access. If `docker ps` reports "permission
  denied", add the user to the `docker` group with `sudo usermod -aG docker $USER` and log in
  again.
- The connector cluster needs two raised kernel limits. Setup raises them itself when it may
  use `sudo`, and otherwise you set them once as root so that they also survive a reboot:

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

With `EDGE_TLS=internal`, every browser and script client must trust the dataspace CA. After
setup, its certificate is stored on the server in `.deploy/ca/dataspace-ca.crt`, from where you
copy it to your computer and add it as described in
[Trusting the dataspace CA](/administration/configuration#trusting-the-dataspace-ca).

### HTTP evaluation mode

If you leave `PUBLIC_DOMAIN` empty and set `PUBLIC_HOST` to the server's IP address, the app
runs over plain HTTP at `http://<PUBLIC_HOST>:8081`.

:::danger Unencrypted
HTTP evaluation mode supports test identities only, and login details, tokens and data sent
over its endpoints are not encrypted. Use it only on a trusted network, and for HTTPS on a
private network set a hostname in `PUBLIC_DOMAIN` together with `EDGE_TLS=internal`.
:::

## Install

```bash
git clone https://github.com/kwe712/OpenDS.git opends && cd opends
cp .env.example .env
```

Then fill in the first section of `.env`:

```bash
PUBLIC_DOMAIN=dataspace.example.org   # your domain; choose it once
EDGE_TLS=acme                         # acme (internet), internal (private network) or files
PAYLOAD_ADMIN_EMAIL=you@example.org   # the first administrator; a real mailbox
```

On a private network, an address-based hostname from `sslip.io` can be used instead of your
own DNS record:

```bash
PUBLIC_DOMAIN=opends.192-168-1-50.sslip.io   # for a server at 192.168.1.50
EDGE_TLS=internal
```

Then start the setup:

```bash
bash manage.sh setup
```

Setup generates any missing secrets and may take several minutes, depending on image
downloads and server resources. When it finishes, it prints:

```text
OpenDS is ready: https://<your domain>
```

Open that address and sign in with `PAYLOAD_ADMIN_EMAIL` and `PAYLOAD_ADMIN_PASSWORD` from
`.env`. With `EDGE_TLS=internal`, trust the dataspace CA first as described above. Running
setup again later keeps your settings and data.

:::warning Choose your domain once
Changing the domain changes the DID of the local issuer, so all credentials must be issued
again. Test identities are tied to the domain as well, and after a change setup stops and
names the command that removes the test identity stack before you run it again. Use a stable
hostname for an installation you intend to keep, because address-based hostnames change
whenever the embedded IP address changes.
:::

## After installation

1. Sign in as the first administrator.
2. Open **Platform Admin** from the account menu and configure email, registration and backups.
3. Try a first exchange between two organizations, as described in
   [Your first data exchange](/guide/first-exchange).

Optional and advanced settings are listed in `.env.example`, commented out with their
defaults, and explained under [Configuration](/administration/configuration). Everyday
commands, backups and updates are described under [Operations](/administration/operations).
