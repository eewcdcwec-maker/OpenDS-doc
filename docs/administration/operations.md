# Operations

## Everyday commands

```bash
bash manage.sh health            # API, database and backend status
bash manage.sh status            # containers and connectors
bash manage.sh rebuild backend   # rebuild and restart after an update
bash manage.sh rebuild frontend
bash manage.sh logs backend
bash manage.sh                   # lists every command
```

Under **Platform Admin → Operations**, administrators can check identity services, connectors,
storage and certificates. Email alerts require monitoring and email to be configured.

## Backups

`bash manage.sh backup create` writes an encrypted, platform-only archive: the platform
database, uploaded contracts, the identity services' PostgreSQL and Vault state, and an
explicit list of platform configuration files. Platform backups exclude connector databases,
Vaults, runtime volumes and source data. **Export connector data** saves portable resource
definitions and reference history; it does not contain connector secrets or source files.
Restoring a platform backup does not restore connector data.

`bash manage.sh backup verify <file>` checks restoration of the archived databases and recorded
backup contents in temporary containers. `bash manage.sh backup restore <file>` replaces this installation's platform
state with the backup: `.env` and platform configuration, the platform database, contract
documents and the identity services on this server. It asks for confirmation
(`OPENDS_RESTORE_CONFIRM=yes` without a terminal). On a new server, install OpenDS first and
pass the original passphrase with `BACKUP_PASSPHRASE=...`. Platform-hosted connectors on the
same server keep their runtime data; on a new server, reprovision them, import portable
definitions and configure credentials again. A platform restore skips a production identity on
a separate identity host; follow the separate-host recovery procedure in
[Identity hosting](/identity/identity-hosting#rebuilding-a-lost-identity-host). Backups use
`BACKUP_PASSPHRASE` from `.env`, generated on first use; keep a copy somewhere other than the
server. The backup service follows the settings
under **Platform Admin → Operations**: daily backups, retention, backups on demand and
downloads.

Backup creation checks contract filenames and checksums before and after copying. Verification
compares restored contract references with the archive. Missing files, checksum failures or
changed inventories cause the check to fail. Contract inventories are limited to 100,000
documents. The database and contract files are copied separately, so pause uploads and deletions
while taking a backup if you need a consistent recovery point.

## Self-hosted connectors

Organizations install, run and move their self-hosted connectors themselves:
[Self-hosted connector](/guide/self-hosted-connector). For the operator:

- The installer link can download setup files with identity credentials and enroll one agent.
  After the agent enrolls, the link no longer works. A new installer, **Reinstall** or a
  rotated STS secret makes earlier unused links invalid.
- OpenDS stores only hashes of installer and agent tokens and keeps installer requests out of
  its own request logs. Configure any reverse proxy, monitoring service and shell history in
  front of OpenDS to protect the links too.
- A self-hosted connector counts as running only when its control plane, data plane and proxy
  are healthy and the data plane is registered; an online agent alone is not enough.
- Deleting the platform record of an offline connector cannot erase the remote machine.

## Platform secrets

Setup generates two secrets in `.env`; backups include them.

- `PAYLOAD_SECRET` signs sign-in sessions and automation API keys. Change it whenever it may
  have leaked: set a new value of 32 characters or more in `.env`, then run
  `docker compose up -d backend worker`. Everyone signs in again, and automation API keys
  must be created again. Connectors and stored data are not affected.
- `OPENDS_DATA_KEY` derives each platform-hosted connector's Vault token and management key
  and encrypts organizations' identity secrets and the SMTP password. Do not change it:
  existing connectors and identities would stop working.

Never deprovision a connector to change its configuration: its products and policies live
on the connector.
