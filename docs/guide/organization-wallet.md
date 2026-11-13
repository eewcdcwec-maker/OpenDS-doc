---
id: organization-wallet
title: Your own wallet
---

# Your own wallet

Use this guide when your organization chooses **Self-hosted identity**. The wallet runs on
your server and gives your organization its own `did:web` identity. Its private key stays on
that server. OpenDS receives only the public key, proof that you control it, and the STS
secret that your connectors use.

For the identity choices and what changing them deletes, see
[Identity](/guide/identity).

## Before you start

You need:

- A Linux server with Docker Engine and Docker Compose v2.
- A lowercase DNS name for the wallet, such as `wallet.example.org`, pointing to the server.
  For a short-lived test, an address-based `sslip.io` name can be used instead.
- Inbound TCP port 443. The wallet obtains its public certificate with the TLS-ALPN challenge.
- An OpenDS organization configured for **Self-hosted identity**.

Download the wallet bundle from **Organization → Dataspace identity**. The bundle is configured
for your dataspace and includes its CA certificate when the dataspace uses a private CA. Keep
the extracted directory private: setup writes secrets to its `.env` file.

## Start the wallet

On the wallet server, extract the bundle, open its directory, then run:

```bash
./wallet.sh setup wallet.example.org
sudo ./wallet.sh start
sudo docker compose logs -f identityhub
```

Replace `wallet.example.org` with your wallet's DNS name. Wait until the IdentityHub log reports
that the runtime is ready. The setup command creates `.env` with generated secrets; do not add
it to source control or share it.

### Share one HTTPS entry with connectors

If this server also runs your self-hosted connectors, add `--shared-edge` when setting up the
wallet:

```bash
./wallet.sh setup wallet.example.org --shared-edge
```

Start the connectors with `CONNECTOR_EDGE=shared`. The wallet and connectors then share one
HTTPS entry on TCP port 443. Stopping the wallet removes its entry from that shared edge.

### Use an existing reverse proxy

If nginx or Traefik already terminates HTTPS for this server, use `--external-proxy` instead of
`--shared-edge`:

```bash
./wallet.sh setup wallet.example.org --external-proxy 127.0.0.1:9443
sudo ./wallet.sh start
```

For a proxy on another host, use the wallet server's private address and add
`--proxy-allow <proxy-address>`. After startup, add either `external-proxy/nginx.conf` or
`external-proxy/traefik.yml` to your proxy configuration. The proxy needs a certificate for
the wallet domain. Only the DID document, credential service and STS are intended to be public;
the management API remains private.

## Connect the wallet to OpenDS

In OpenDS, open **Organization → Dataspace identity** and complete the steps shown there.

1. Under **DID document**, run `./wallet.sh public-key` and paste its output. Enter this
   credential-service endpoint, replacing the domain:

   ```text
   https://wallet.example.org/api/credentials/v1/participants/did:web:wallet.example.org
   ```

   Download the generated `did.json` and save it as `./did/did.json` in the wallet directory.
   The wallet then publishes it at `https://wallet.example.org/.well-known/did.json`.
2. Under **Ownership**, sign the challenge that OpenDS displays and paste the result:

   ```bash
   ./wallet.sh sign '<challenge>'
   ```

3. Under **Wallet**, enter the STS URL
   `https://wallet.example.org/api/sts/token`, the same credential-service endpoint, and the
   secret printed by:

   ```bash
   ./wallet.sh secret
   ```

4. OpenDS assigns your BPN and shows **Waiting for a platform administrator**. An
   administrator confirms that the domain belongs to your organization and approves the
   identity under **Platform Admin → Production identities awaiting approval**. (Your
   organization itself was approved earlier, after registration.)
5. After approval, request credentials using the issuer DID displayed by OpenDS:

   ```bash
   ./wallet.sh request-credentials '<issuer-DID>'
   ./wallet.sh status
   ```

   OpenDS marks the identity ready after all required credentials are issued.

After you add connectors, OpenDS lists their `DataService` entries. Add those entries to the
`service` array in `./did/did.json` so partners can find the connectors.

## Operate and recover the wallet

- Start it with `sudo ./wallet.sh start`; stop it with `sudo ./wallet.sh stop`.
- To rotate the shared STS secret, run `./wallet.sh rotate-secret`, then enter the printed
  value in OpenDS under **Organization → Rotate STS secret**. Connectors cannot obtain new
  tokens until OpenDS receives and distributes the replacement secret.
- Back up the `vault`, `vault-keys`, and `postgres` Docker volumes together. Losing them loses
  the wallet's private keys.
- The wallet's IdentityHub management API is private to its Docker network. Do not publish it.
