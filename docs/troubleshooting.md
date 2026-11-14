---
id: troubleshooting
title: Troubleshooting
---

# Troubleshooting

Start with these three commands on the OpenDS server; they answer most questions:

```bash
bash manage.sh health            # API, database and backend reachable?
bash manage.sh status            # containers, Kubernetes target and connector pods
bash manage.sh logs backend      # what the backend reports
```

Remove API keys, installer links and passwords from any logs you share.

## Installation

| Symptom                                                           | What to do                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Setup says "permission denied" for the Docker socket              | Add the user to the `docker` group (`sudo usermod -aG docker $USER`), sign in again, rerun setup. |
| Setup stops with "Run sudo sysctl -w fs.inotify…"                 | Set the two kernel limits once as root, as shown under [Requirements](/getting-started#requirements), then rerun setup. |
| After changing the domain, setup stops with "The test issuer was created for another address" | Run the command it names (`docker compose -p opends-identity-test down -v`) and rerun setup. Test identities start over. |
| Browser warns about the certificate                               | With `EDGE_TLS=internal`, trust the [dataspace CA](/administration/configuration#trusting-the-dataspace-ca) once. |
| No HTTPS certificate, Let's Encrypt reports a rate limit (429)    | Let's Encrypt limits how many certificates one name gets per week. Wait, or use your own certificate (`EDGE_TLS=files`). |
| The app is not on port 443 without a domain                       | Without `PUBLIC_DOMAIN` it runs over plain HTTP at `http://<PUBLIC_HOST>:8081`.                  |
| No password resets, no notifications                              | Set up an SMTP server under **Platform Admin → Email**.                                         |

## Connectors

| Symptom                                                    | What to do                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Provisioning fails with "no free capacity"                 | Each platform-hosted connector needs about 1.3 CPU cores and 2.3 GB RAM. Pause another connector or add capacity, then provision again. |
| Self-hosted connector is not "Running"                     | Its control plane, data plane and proxy must be healthy and registered. Check `curl http://localhost:7070` on its server. |
| Self-hosted connector shows **Degraded**, **Agent offline** | It is stopped or cannot reach OpenDS. Run `sudo sh ./start.sh` in its folder.                   |
| Cannot create or edit a product or policy                  | Choose a running connector; paused or stopped connectors cannot be edited.                       |
| Cannot change or delete a product or policy                | Withdraw the offers that use it first.                                                          |
| Publishing a login-protected offer fails with "destination is not public" | The login service is on a private network. An operator allows its exact origin with `SOURCE_LOGIN_PRIVATE_ORIGINS`. |
| A self-hosted server was lost or replaced                  | **Reinstall** on the Hosting tab, then rotate the STS secret ([Move to another server](/guide/self-hosted-connector#moving-to-another-server)). |

## Identity and wallets

| Symptom                                                    | What to do                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| DID verification says the domain "resolves to … a private network address" | The wallet is on a private network. An operator allows that network with `ORGANIZATION_PRIVATE_NETWORKS`. |
| Credentials are not issued, the wallet log shows "JWT signature not valid" | The published `did.json` does not match the wallet's key. Publish the `did.json` OpenDS generated for the wallet's current key; the issuer may keep the old document for a few minutes. |
| The wallet is unreachable after a restart                  | Start it with `sudo ./wallet.sh start`, which also unseals its Vault.                          |

## Exchange and API

| Symptom                                                    | What to do                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A provider's offers do not appear under **Discover**       | Its connector must be running and listed (**List in discovery**). Paused connectors are hidden. |
| Partners cannot negotiate an offer                         | Republish it if the app marks it as needing a fix.                                             |
| Scripts get empty results or authentication errors         | Check the `Authorization` header, `x-tenant-id` (the organization's ID), the key's expiry and your permissions. `GET /api/users/me` shows whether the key signs you in. |
