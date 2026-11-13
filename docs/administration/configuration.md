# Configuration

Installation settings live in `.env`, which setup creates from your values and fills in
(see `.env.example`). Settings people change while the platform runs are
in the app under **Platform Admin**: platform administrators open it from the account menu
(their name at the bottom of the sidebar).

## Settings in the app

- **Email** tab: the SMTP server for password resets, invitations and alerts; changes
  apply without a restart. The SMTP password is stored encrypted with a key derived from
  `OPENDS_DATA_KEY`. `SMTP_*` values in `.env` are only used when no server is saved in the
  app. Port 465 uses TLS and every other port requires STARTTLS; a local relay without it
  needs `SMTP_ALLOW_PLAINTEXT=true` in `.env`. Without email, password reset is off and
  inviters set an initial password.
- **Dataspace** tab: registration, with a support contact for when it is closed and the
  participation terms organizations accept when they register, the usage purposes organizations choose from in usage
  policies, the product categories (products use only these) and suggested tags, identity
  hosting, and the private networks (read-only; they are set in `.env`).
- **Operations** tab: monitoring, and backups (schedule, retention, backups on demand and
  downloads; see [Operations](/administration/operations#backups)).

Organization owners and administrators have two settings under **Organization →
Organization settings**:

- **Track activity** (default Yes). No stops new activity audit entries for that
  organization, including those of background jobs; existing entries remain. Membership,
  permissions, operational task records and server logs are unaffected.
- **Access requests** (default Yes) lets offers require manual provider approval. Withdraw
  active manual-approval offers before turning it off. Automatic offers still enforce
  connector policies, and requesting access from other providers remains available.

## Administrator account

Setup creates the first platform administrator from `PAYLOAD_ADMIN_EMAIL` and
`PAYLOAD_ADMIN_PASSWORD` (generated when empty, 16 characters at least). Use a real mailbox:
password resets and alerts go there. To change the address later, edit `.env` and run
`docker compose up -d backend worker`. The one platform administrator then signs in with
the new address; nothing changes if the address is taken or there are several
administrators.

## Domain and certificates

With `PUBLIC_DOMAIN` set, everything is served over HTTPS on that domain. Without it,
OpenDS runs over plain HTTP on `PUBLIC_HOST`: logins, tokens (including self-hosted
installer URLs), connector messages and data are unencrypted, and only disposable test
identities exist. That mode is for trying OpenDS on a trusted network, never for real data.
A private network does not need a public domain: an address-based name such as
`opends.192-168-1-50.sslip.io` with `EDGE_TLS=internal` gives full HTTPS.

Choose the domain once, before approving production organizations: every production DID
contains it, so changing it later invalidates all production identities and credentials
([identity hosting](/identity/identity-hosting#choose-the-domain-once)).

| Setting         | Value            | Use it when                                                                                                                            |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `EDGE_TLS`      | `acme` (default) | The server is reachable from the internet on TCP 443                                                                                   |
|                 | `internal`       | A private network that Let's Encrypt cannot reach                                                                                      |
|                 | `files`          | Provide `.deploy/edge-certs/tls.crt` and `.deploy/edge-certs/tls.key` before setup                                                     |
| `CONNECTOR_TLS` | `public`         | Self-hosted connectors are reachable from the internet                                                                                 |
|                 | `dataspace`      | Self-hosted connectors are reachable by the platform and other connectors but not from the internet (behind NAT, on a private network) |

`acme` and `public` use Let's Encrypt: browsers, scripts and connectors trust these
certificates without any setup. Let's Encrypt checks the domain by connecting to the
server, so it needs a public address and an open TCP 443, for the platform and for each
self-hosted connector. `CONNECTOR_TLS` defaults to `dataspace` with `EDGE_TLS=internal` and to
`public` otherwise. A common production layout is `acme` with `CONNECTOR_TLS=dataspace`: a
public platform that people and scripts reach without setup, and self-hosted connectors that
need no public certificate.

### Trusting the dataspace CA

The dataspace CA is a certificate authority OpenDS creates for the installation.
Connectors and identity services trust it automatically. Anything else that connects to a
server using it must trust its root certificate once. It is on the OpenDS server in
`.deploy/ca/dataspace-ca.crt`, and published at `https://<domain>/dataspace-ca.crt`. That
address is itself served with the dataspace CA, so the first download shows a certificate
warning. Before trusting a downloaded copy, compare its fingerprint with the one on the
server:

```bash
openssl x509 -in .deploy/ca/dataspace-ca.crt -noout -fingerprint -sha256
```

Then add it:

- Browsers: add it to the operating system's trusted root certificates (Windows: Trusted
  Root Certification Authorities; macOS: Keychain Access, set to Always Trust; Linux:
  `/usr/local/share/ca-certificates` and `update-ca-certificates`).
- curl: `--cacert dataspace-ca.crt`. Python `requests`: `verify="dataspace-ca.crt"` or
  `REQUESTS_CA_BUNDLE`. Node.js: `NODE_EXTRA_CA_CERTS`.

## Private networks

OpenDS only connects to public addresses by default, so addresses that organizations or
providers enter cannot point it at internal services. Two settings in `.env` allow
specific private destinations; restart the backend after changing them
(`docker compose up -d backend worker`).

**Organizations with their own wallet.** OpenDS fetches the organization's DID document and
checks its wallet over HTTPS. On a private network, list the hosts or ranges where
organizations run their wallets:

```bash
ORGANIZATION_PRIVATE_NETWORKS=192.168.0.10/32,10.20.0.0/24
```

Entries must be private (10/8, 172.16/12, 192.168/16, IPv6 fc00::/7) and no wider than /16
(IPv6 /48); the backend refuses to start otherwise. Loopback, link-local, cloud metadata and
carrier-grade NAT addresses stay blocked. Every DNS answer must be allowed, the connection is
pinned to the checked address and checked again once connected, and the certificate must be
valid (the dataspace CA is trusted). Do not list networks that contain the platform's own
services.

**Login-protected data sources.** When a platform-hosted connector publishes a source that
needs a login, the backend resolves the login host, rejects non-public addresses and pins
the checked address for the request. To allow a private login service, list its exact
origins (scheme, host and port; no wildcards):

```bash
SOURCE_LOGIN_PRIVATE_ORIGINS=http://thingsboard.internal:8080
```

This grants the backend network access to that origin, so list only trusted login
services. Source login requests always reject redirects and responses larger than 1 MiB;
the backend also limits login bodies to 64 KiB and requests to 20 seconds. Connector-local
refresh workers and self-hosted agents reach their own private source networks without this
setting; configure connector egress rules for the networks those connectors may access.

**Cloud storage endpoints.** Connector cloud storage accepts only AWS and the Azure clouds'
own endpoints (`https://<account>.blob.core.windows.net`, Azure China and Azure Government),
since the backend sends uploads there. Storage emulators for tests are allowed by exact
origin with `CLOUD_STORAGE_ENDPOINTS=http://203.0.113.10:4566,http://203.0.113.10:10000`.

## Ports

| Service                     | Default port           | Visibility                                                                                      |
| --------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| HTTPS (with a domain)       | 443                    | Public                                                                                          |
| Frontend and API proxy      | 8081                   | Public without a domain; with one, this server only (the HTTPS edge reaches the app internally) |
| Connector gateway           | 80                     | Public without a domain; with one, this server only                                             |
| PostgreSQL                  | 5432                   | Loopback only                                                                                   |
| Backend                     | 8080                   | Internal Docker network                                                                         |
| Frontend development server | 5173                   | Local by default                                                                                |
| Self-host connector proxy   | 443 on connector host  | Public (80 instead with `CONNECTOR_TLS=off`, for tests only)                                    |
| Self-host agent status      | 7070 on connector host | This host only by default; `AGENT_STATUS_BIND=0.0.0.0` opens it                                 |

Run one OpenDS installation per server: the HTTPS edge needs TCP 443 for itself. If another
service already uses 8081, 80 or 5432, change `FRONTEND_PORT`, `CONNECTOR_PUBLIC_HTTP_PORT` or
`POSTGRES_PORT` in `.env` before setup. Open the public ports in both the host firewall and any
cloud security group. Without a
domain, public transfer URLs are `http://<host>/connectors/<connector-slug>/api/public`,
without private DNS or hosts-file edits. Transfer access includes an expiring authorization
token. Public data proxies allow browser CORS requests with that Authorization header; they
do not enable cookie credentials.

The local cluster's ingress controller is Traefik
(`infra/kubernetes/traefik-values.yaml`). Its
ingress-nginx provider serves the `nginx` IngressClass and the NGINX CORS annotations of
connector data planes, so the Tractus-X charts stay unchanged. A remote cluster needs a
controller for that class with equivalent public-data CORS behavior.

## Separate connector cluster

Platform-hosted connectors can run on a Kubernetes cluster on another server instead of the
local one: [Remote connector cluster](/administration/remote-cluster).
