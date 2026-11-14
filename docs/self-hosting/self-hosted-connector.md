---
title: Self-hosted connector
---

# Self-hosted connector

A self-hosted connector runs on your organization's own server with Docker, while it is
managed from OpenDS like any other connector. A small agent next to the connector picks up the
work queued in OpenDS, such as creating products, publishing offers and health checks, and runs
it locally, so OpenDS never needs access to the management interfaces of your server. Source
passwords and cloud keys are entered on your server and never pass through OpenDS.

## Requirements

- A Linux server with Docker Engine and Docker Compose v2.
- Inbound TCP port 443 from your partners, either from the internet or from your private
  network.
- Ideally a DNS name for the connector, such as `connector.example.org`, that points at the
  server. Without one, the connector uses names derived from the server's IP address via
  `sslip.io`, which need no DNS record.
- A connector in OpenDS, created under **Connectors → New connector**.

## Installation

1. Open the connector, go to its **Hosting** tab and select **Use self-hosting**. A dialog
   shows the install commands, with a one-time installer link, and the commands to start,
   stop and delete it later.
2. On your server, run the first command, which downloads the bundle into a folder named
   after the connector together with a `README.md`.
3. Start the connector, with your DNS name if you have one:

   ```bash
   sudo env OPENDS_PUBLIC_HOST=connector.example.org sh ./start.sh
   ```

4. After about half a minute, the connector shows **Running** in OpenDS. Then select
   **List in discovery** on the **Hosting** tab so that partners find its offers.

:::warning Keep the installer link private
Until the connector has started once, anyone with the link can download setup files that
contain your connector's identity credentials. Treat the link and the folder as secrets, and
use **Reinstall** as described below if the link leaks or the server is lost.
:::

## HTTPS options

By default, the connector runs its own HTTPS server on TCP port 443 and obtains its
certificate from Let's Encrypt, or from the dataspace CA on a private network. Another layout
can be chosen when the server already runs other services:

| Your server                                     | Start with                                                   |
| ----------------------------------------------- | ------------------------------------------------------------ |
| Runs only this connector                        | `sudo sh ./start.sh` (the default)                           |
| Runs several connectors, or your own wallet too | `sudo env CONNECTOR_EDGE=shared AGENT_STATUS_PORT=7071 sh ./start.sh`, and the wallet with `--shared-edge` |
| Already has nginx or Traefik on TCP 443         | `sudo env CONNECTOR_EDGE=external EXTERNAL_PORT=8443 sh ./start.sh` |
| Is the OpenDS server itself                     | `sudo env CONNECTOR_HTTP_PORT=18080 AGENT_STATUS_PORT=17070 sh ./start.sh` |

With **shared**, one HTTPS entry on TCP port 443 serves every connector and the wallet on the
server, and each connector needs its own `AGENT_STATUS_PORT`.

With **external**, the connector listens on `127.0.0.1:8443` only and writes
`external-proxy/nginx.conf` and `external-proxy/traefik.yml` for its host name:

- **nginx**: add the file inside the `http` block, for example as
  `/etc/nginx/conf.d/opends-connector.conf`, place your certificate at the paths it names and
  add `server_names_hash_bucket_size 128;` once to the `http` block.
- **Traefik**: add the file to Traefik's file provider. Either set
  `OPENDS_TRAEFIK_CERTRESOLVER=<your resolver>` before `start.sh` so that the file uses it, or
  give Traefik a certificate for the host name. Set `OPENDS_TRAEFIK_ENTRYPOINT` if your HTTPS
  entry point is not called `websecure`.

For a proxy on another server, also set `EXTERNAL_BIND=<this server's private address>` and
`EXTERNAL_ALLOW=<proxy address>/32`. The proxy then reaches the connector over TLS and verifies
it with `external-proxy/upstream-ca.crt`.

## Source passwords and cloud keys

The offer dialog shows the command for a login-protected product, for example:

```bash
sudo sh ./source-secret.sh <product-id> bearer      # or basic, header, login-body
```

Run it in the connector folder before publishing, and it asks for the secret and stores it on
the connector. Keys for Amazon S3 or Azure are stored the same way, after which the region,
buckets, accounts and containers are recorded without keys on the connector's **Cloud
storage** tab:

```bash
sudo sh ./cloud-storage.sh aws
sudo sh ./cloud-storage.sh azure <storage account>
```

## Everyday operation

| Task                       | On the server, in the connector folder  |
| -------------------------- | --------------------------------------- |
| Stop (keeps all data)      | `sudo sh ./stop.sh`                     |
| Start again                | `sudo sh ./start.sh`                    |
| Remove completely          | `sudo sh ./delete.sh`                   |
| Agent status               | `curl http://localhost:7070`, or your `AGENT_STATUS_PORT` |

While the connector is stopped, OpenDS shows it as **Degraded** with **Agent offline**, and
**Platform Admin → Operations → Monitoring** lists it as not working. Deleting the connector in
OpenDS or switching it to platform hosting is refused while its agent is online, so stop it on
the server first.

## Moving to another server

Products, policies and offers are stored in the connector's database on the server, so a new
installation starts empty. To move the connector:

1. On the connector page, select **More → Export connector data** while the old server still
   runs.
2. On the **Hosting** tab, select **Reinstall**. The old server loses access immediately, and a
   new install command is shown.
3. Install on the new server, then select **More → Import connector data** with the exported
   file. Offers are not published automatically.
4. Run `source-secret.sh` and `cloud-storage.sh` again on the new server, because secrets are
   never exported.
5. Rotate the STS secret under **Organization → Rotate STS secret**, because the old setup
   files contained it, and publish the offers again.

Existing agreements and transfers cannot be moved, so partners negotiate again.

## Switching to platform hosting

Stop the connector on its server, then select **Use platform hosting** on the **Hosting** tab
and **Provision**, after which OpenDS runs it on Kubernetes. Export its data first if you want
to keep its products and policies.
