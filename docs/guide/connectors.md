---
id: connectors
title: Connectors
---

# Connectors

A connector is the software that exchanges data for your organization. Under **Connectors** you
create and manage them.

## Choose where it runs

| Mode              | Where it runs                                    | Good for                                      |
| ----------------- | ------------------------------------------------ | --------------------------------------------- |
| Platform-hosted   | On Kubernetes managed by the platform operator   | No connector installation for your organization |
| Self-hosted       | On your organization's Docker host               | Your organization operates the connector      |

All three identity types work with either hosting mode. You can change hosting from the
connector page, but it is a migration: export the connector data first, configure the new
runtime, import portable definitions and enter source credentials again.

## Self-hosting a connector

Create the connector, then select **Use self-hosting** on its **Hosting** tab and run the
commands shown on your Docker host. [Self-hosted connector](/guide/self-hosted-connector)
covers installing, the HTTPS options (own, shared with a wallet, behind nginx or Traefik),
source and cloud credentials, and moving to another server.

## Lifecycle

**Provision**, **Pause** and **Resume** are at the top of the connector page; the
**Hosting** tab holds them too, with **Deprovision**, **Delete connector** and the
self-hosting actions.

- **Provision** a new platform-hosted connector from its page. Provisioning may take several
  minutes while images download and services start. **Pause** stops connector services while
  retaining their data, and hides its offers from **Discover**; **Resume** starts them again. **Deprovision** uninstalls the runtime.
- **List in discovery** on the connector page, so other organizations find its offers under
  **Discover**. A connector that is not listed still exchanges data, but partners only reach
  it with its DSP address.
- **Export connector data** while it is online, to move it or keep a copy
  ([API](/reference/api#connector-data-export-and-import)).
- **Delete** removes the connector and its platform record. Stop a self-hosted connector on its
  host first; OpenDS cannot erase a remote machine. Export portable definitions before removal
  if you need them later.
- **Health checks** run regularly; the connector page shows the result and recent events.

## Who can do what

Connector **Managers** can do anything on their connectors, including giving other members
access. **Viewers** can read. Owners and administrators are Managers on every connector of
their organization.
