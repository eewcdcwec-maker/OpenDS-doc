---
id: self-hosted-connector
title: Self-hosted connector
---

# Self-hosted connector

A self-hosted connector runs on your organization's own server with Docker, while you manage
it from OpenDS like any other connector. A small agent next to it collects the work OpenDS
queues (creating products, publishing offers, health checks) and runs it locally, so OpenDS
never needs access to your server's management interfaces. Source passwords and cloud keys
are entered on your server and never pass through OpenDS.

## Before you start

You need:

- A Linux server with Docker Engine and Docker Compose v2.
- Inbound TCP 443 from your partners (the internet, or your private network).
- Ideally a DNS name for the connector, such as `connector.example.org`, pointing at the
  server. Without one, the connector gets names built from the server's IP address
  (`sslip.io`), which need no DNS record.
- A connector in OpenDS, created under **Connectors → New connector**.

## Install it

1. Open the connector, go to its **Hosting** tab and select **Use self-hosting**. A dialog
   shows the install commands, with a one-time installer link, and the commands to start,
   stop and delete it later.
2. On your server, run the first command. It downloads the bundle into a folder named after
   the connector. Read the bundle's `README.md` there.
3. Start it, with your DNS name if you have one:

   ```bash
   sudo env OPENDS_PUBLIC_HOST=connector.example.org sh ./start.sh
   ```

4. After about half a minute the connector shows **Running** in OpenDS. Then select
   **List in discovery** on the Hosting tab so partners find its offers.

:::warning Keep the installer link private
Anyone with the link can download setup files that contain your connector's identity
credentials, until the connector has started once. Treat the link and the folder as
secrets. If the link leaks or the server is lost, use **Reinstall** (below).
:::

## Choose how partners reach it

By default the connector runs its own HTTPS server on TCP 443 and gets its certificate from
Let's Encrypt (or, on a private network, from the dataspace's own CA). Pick another layout
when the server already does more:

| Your server                                     | Start with                                                   |
| ----------------------------------------------- | ------------------------------------------------------------ |
| Runs only this connector                        | `sudo sh ./start.sh` (the default)                           |
| Runs several connectors, or your own wallet too | `sudo env CONNECTOR_EDGE=shared AGENT_STATUS_PORT=7071 sh ./start.sh`; start the wallet with `--shared-edge` |
| Already has nginx or Traefik on TCP 443         | `sudo env CONNECTOR_EDGE=external EXTERNAL_PORT=8443 sh ./start.sh` |
| Is the OpenDS server itself                     | `sudo env CONNECTOR_HTTP_PORT=18080 AGENT_STATUS_PORT=17070 sh ./start.sh` |

With **shared**, one HTTPS entry on TCP 443 serves every connector and the wallet on the
server; give each connector its own `AGENT_STATUS_PORT`.

With **external**, the connector listens on `127.0.0.1:8443` only and writes
`external-proxy/nginx.conf` and `external-proxy/traefik.yml` for its host name:

- **nginx**: add the file inside the `http` block (for example as
  `/etc/nginx/conf.d/opends-connector.conf`), put your certificate at the paths it names,
  and add `server_names_hash_bucket_size 128;` once to the `http` block.
- **Traefik**: add the file to Traefik's file provider. Either set
  `OPENDS_TRAEFIK_CERTRESOLVER=<your resolver>` before `start.sh` so the file names it, or
  give Traefik a certificate for the host name. Set `OPENDS_TRAEFIK_ENTRYPOINT` if your HTTPS
  entry point is not called `websecure`.

For a proxy on another server, also set `EXTERNAL_BIND=<this server's private address>` and
`EXTERNAL_ALLOW=<proxy address>/32`; the proxy then reaches the connector over TLS and uses
`external-proxy/upstream-ca.crt` to verify it.

## Data source passwords and cloud keys

The offer dialog shows the command for a login-protected product, for example:

```bash
sudo sh ./source-secret.sh <product-id> bearer      # or basic, header, login-body
```

Run it in the connector folder before publishing; it asks for the secret and stores it in the
connector's own Vault. For Amazon S3 or Azure, store the keys the same way and then record the
region, buckets, accounts and containers (without keys) on the connector's **Cloud storage**
tab:

```bash
sudo sh ./cloud-storage.sh aws
sudo sh ./cloud-storage.sh azure <storage account>
```

## Day to day

| Task                       | On the server, in the connector folder  |
| -------------------------- | --------------------------------------- |
| Stop (keeps all data)      | `sudo sh ./stop.sh`                     |
| Start again                | `sudo sh ./start.sh`                    |
| Remove completely          | `sudo sh ./delete.sh`                   |
| Agent status               | `curl http://localhost:7070` (or your `AGENT_STATUS_PORT`) |

While the connector is stopped, OpenDS shows it as **Degraded** with **Agent offline**, and
**Platform Admin → Operations → Monitoring** lists it as not working. Deleting the connector
in OpenDS, or switching it to platform hosting, is refused while its agent is online: stop it
on the server first.

## Move to another server

Your products, policies and offers are stored in the connector's database on the server, so
a new installation starts empty. To move:

1. On the connector page, select **More → Export connector data** while the old server still
   runs.
2. On the Hosting tab, select **Reinstall**. The old server loses access at once and a new
   install command is shown.
3. Install on the new server, then **More → Import connector data** with the exported file.
   Offers are not published automatically.
4. Run `source-secret.sh` and `cloud-storage.sh` again on the new server: secrets are never
   exported.
5. Rotate the STS secret (**Organization → Rotate STS secret**), since the old setup files
   contained it, and publish the offers again.

Existing agreements and transfers cannot be moved; partners negotiate again.

## Switch to platform hosting

Stop the connector on its server, then select **Use platform hosting** on the Hosting tab and
**Provision**. OpenDS runs it on Kubernetes from then on. Export its data first if you want to
keep its products and policies.
