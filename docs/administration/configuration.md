---
title: Configuration
---

# Configuration

Installation settings are stored in `.env`. Setup creates this file if it does not exist and
fills in missing values, such as the database password, application secrets, and the
administrator's email and password. You can start with `.env.example`, which lists all optional
settings, but this is not required. Settings that can be changed while the platform is running
are managed in the app under **Platform Admin**. Platform administrators can open it from the
account menu.

## Settings in the app

| Tab        | Settings                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email      | The SMTP server for password resets, invitations and alerts, applied without a restart                                                                                             |
| Dataspace  | Registration and the support contact shown when it is closed, the participation terms, the usage purposes, product categories and suggested tags, and identity hosting           |
| Operations | Monitoring and backups, as described under [Operations](/administration/operations#backups)                                                                                     |

- **Email**: the SMTP password is stored encrypted. `SMTP_*` values in `.env` are used only if
  no SMTP server has been saved in the app. Port 465 uses TLS. All other ports require
  STARTTLS. For a local relay that does not support STARTTLS, set `SMTP_ALLOW_PLAINTEXT=true`
  in `.env`, then run `docker compose up -d backend worker`. Without email configured, password
  resets are unavailable, and inviters must set an initial password.
- **Private networks**: the configured networks are displayed as read-only on the **Dataspace**
  tab. They are set in `.env`, as described [below](#private-networks).

Organization owners and administrators have their own settings under **Organization →
Organization settings**, described under
[Organization and members](/user-guide/organization-and-members#organization-settings).

## Administrator account

Setup creates the first platform administrator using `PAYLOAD_ADMIN_EMAIL` and
`PAYLOAD_ADMIN_PASSWORD`. If the password is empty, one is generated with at least 16
characters. Use a real mailbox, because password resets and alerts are sent there.

To change the administrator's email address later, edit `.env` and run:

```bash
docker compose up -d backend worker
```

The platform administrator must then sign in using the new address. The change is skipped if
the address is already in use or if there are several platform administrators.

To make another account a platform administrator, run:

```bash
bash manage.sh make-admin <email>
```

The account must already exist. The new administrator must sign out and sign in again for the
change to take effect.

## Domain and certificates

When `PUBLIC_DOMAIN` is set, OpenDS is served over HTTPS on that domain. Without it, OpenDS
runs in the unencrypted HTTP evaluation mode described under
[Installation](/getting-started/installation#option-4-http-evaluation).

A private network does not require a public domain. An address-based name, such as
`opends.192-168-1-50.sslip.io`, combined with `EDGE_TLS=internal`, provides HTTPS.

Choose the domain before approving production organizations. The issuer's DID and every
managed identity's DID contain this domain, and the issuer is also named in every credential.
Changing the domain later therefore invalidates all production identities and credentials.

| Setting         | Value            | Use it when                                                                                                                         |
| --------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `EDGE_TLS`      | `acme` (default) | The server is reachable from the internet on TCP port 443                                                                           |
|                 | `internal`       | The server is on a private network that Let's Encrypt cannot reach                                                                  |
|                 | `files`          | You provide `.deploy/edge-certs/tls.crt` and `.deploy/edge-certs/tls.key` before setup                                              |
| `CONNECTOR_TLS` | `public`         | Self-hosted connectors are reachable from the internet                                                                              |
|                 | `dataspace`      | Self-hosted connectors are reachable by the platform and other connectors, but not from the internet, for example behind NAT        |

The `acme` and `public` options use Let's Encrypt certificates, which browsers, scripts and
connectors trust without additional configuration. Let's Encrypt verifies the domain by
connecting to the server, so the platform and each self-hosted connector must have a public
address and an open TCP port 443.

`CONNECTOR_TLS` defaults to `dataspace` when `EDGE_TLS=internal` and to `public` otherwise.

A common production configuration is `EDGE_TLS=acme` with `CONNECTOR_TLS=dataspace`. Users and
scripts can access the public platform without installing a CA certificate, and self-hosted
connectors do not need public certificates. However, a script that retrieves data directly from
such a connector must trust the dataspace CA, because the connector's data address is served
with it. **Access details** shows a notice, and its code samples already include `--cacert`.

### Trusting the dataspace CA

The dataspace CA is a certificate authority that OpenDS creates during installation.
Connectors and identity services trust it automatically. Any other client that connects to a
server using this CA must trust its root certificate once.

The certificate is stored on the OpenDS server in `.deploy/ca/dataspace-ca.crt` and published
at `https://<domain>/dataspace-ca.crt`. With `EDGE_TLS=internal`, that address is itself served
with the dataspace CA, so the first download shows a certificate warning.

Before trusting a downloaded copy, compare its fingerprint with the certificate on the server:

```bash
openssl x509 -in .deploy/ca/dataspace-ca.crt -noout -fingerprint -sha256
```

Then add the certificate to your clients:

- **Browsers**: add it to the operating system's trusted root certificates, under Trusted Root
  Certification Authorities on Windows, in Keychain Access set to Always Trust on macOS, or in
  `/usr/local/share/ca-certificates` followed by `update-ca-certificates` on Linux.
- **Scripts**: use `--cacert dataspace-ca.crt` with curl, `verify="dataspace-ca.crt"` or
  `REQUESTS_CA_BUNDLE` with Python `requests`, and `NODE_EXTRA_CA_CERTS` with Node.js.

## Private networks

By default, OpenDS connects only to public addresses. This prevents organizations from using
addresses that point to internal services. Three settings in `.env` allow specific private
destinations. After changing them, restart the backend:

```bash
docker compose up -d backend worker
```

- **Self-hosted wallets**: OpenDS fetches the DID document of an organization with a self-hosted
  identity over HTTPS. On a private network, list the hosts or ranges where organizations run their wallets:

  ```bash
  ORGANIZATION_PRIVATE_NETWORKS=192.168.0.10/32,10.20.0.0/24
  ```

  Entries must be private ranges no wider than /16 (IPv6 /48). Otherwise, the backend refuses to
  start. Do not list networks that contain the platform's own services.

- **Login-protected sources**: to allow a login service on a private network for a
  platform-hosted connector, list its exact origins with scheme, host and port:

  ```bash
  SOURCE_LOGIN_PRIVATE_ORIGINS=http://login.example.internal:8080
  ```

  This gives the backend network access to that origin, so list only trusted login services.
  Self-hosted connectors reach their own private networks without this setting.

- **Cloud storage endpoints**: cloud storage accepts only official AWS and Azure endpoints,
  including Azure China and Azure Government. For testing, storage emulators can be allowed by
  specifying their exact origins:

  ```bash
  CLOUD_STORAGE_ENDPOINTS=http://203.0.113.10:4566,http://203.0.113.10:10000
  ```

## Ports

| Service                     | Default port           | Visibility                                                       |
| --------------------------- | ---------------------- | ---------------------------------------------------------------- |
| HTTPS (with a domain)       | 443                    | Public                                                           |
| Frontend and API proxy      | 8081                   | Public without a domain, otherwise this server only              |
| Connector gateway           | 80                     | Public without a domain, otherwise this server only              |
| PostgreSQL                  | 5432                   | Loopback only                                                    |
| Backend                     | 8080                   | Internal Docker network                                          |
| Frontend development server | 5173                   | Local by default                                                 |
| Self-hosted connector proxy | 443 on connector host  | Public                                                           |
| Self-hosted agent status    | 7070 on connector host | This host only by default, opened with `AGENT_STATUS_BIND=0.0.0.0` |

Run only one OpenDS installation per server, because its HTTPS entry point requires TCP port
443. If another service already uses port 8081, 80 or 5432, change `FRONTEND_PORT`,
`CONNECTOR_PUBLIC_HTTP_PORT` or `POSTGRES_PORT` in `.env` before setup.

Open the required public ports in both the host firewall and any cloud security group.

## Separate connector cluster

Platform-hosted connectors can also run on a Kubernetes cluster on another server, as
described under [Remote connector cluster](/administration/remote-connector-cluster).
