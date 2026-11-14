---
title: Connectors
---

# Connectors

A connector is the software that exchanges data on behalf of your organization. Connectors are
created and managed under **Connectors**.

## Hosting modes

| Mode            | Where it runs                                  | Suitable for                                       |
| --------------- | ---------------------------------------------- | -------------------------------------------------- |
| Platform-hosted | On Kubernetes, managed by the platform operator | Organizations that do not want to install anything |
| Self-hosted     | On your organization's own Docker host         | Organizations that operate the connector themselves |

The hosting mode can be changed on the connector page. This is a migration, in which you export
the connector data first, set up the new runtime, import the definitions and enter the source
credentials again.

To self-host a connector, create it, select **Use self-hosting** on its **Hosting** tab and run
the commands shown on your Docker host. Installation, HTTPS options, source credentials and
moving to another server are described under
[Self-hosted connector](/self-hosting/self-hosted-connector).

## Lifecycle

**Provision**, **Pause** and **Resume** are at the top of the connector page, and the
**Hosting** tab also contains **Deprovision**, **Delete connector** and the self-hosting
actions.

- **Provision**: installs a new platform-hosted connector, which may take several minutes while
  images are downloaded and services start.
- **Pause** and **Resume**: stop and start the connector services while keeping their data. A
  paused connector's offers are hidden from **Discover**.
- **Deprovision**: uninstalls the runtime.
- **List in discovery**: lets other organizations find the connector's offers under
  **Discover**. A connector that is not listed still exchanges data, but partners can only
  reach it with its DSP address.
- **Export connector data**: saves the connector's data while it is online, to move it or keep
  a copy ([API](/user-guide/api#connector-data-export-and-import)).
- **Delete**: removes the connector and its platform record. Stop a self-hosted connector on its
  host first, because OpenDS cannot erase a remote machine, and export the definitions
  beforehand if you need them later.

Health checks run regularly, and the connector page shows their result together with recent
events. Who may perform these actions is listed under [Roles](/user-guide/overview#roles).
