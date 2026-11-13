# Cloud storage

Connectors can offer data stored in Amazon S3 or Azure Blob Storage and receive data into
their own bucket or container. The login is set once per connector, not per product: a
connector Manager opens the connector's **Cloud storage** tab.

## Supported transfer types

| Source of the product | Pull (download link) | Push to an HTTP endpoint | Push to S3 | Push to Azure |
| --------------------- | -------------------- | ------------------------ | ---------- | ------------- |
| HTTP                  | yes                  | yes                      | yes        | yes           |
| S3                    | no                   | yes                      | yes        | yes           |
| Azure Blob            | no                   | yes                      | yes        | yes           |

- **Pull** is HTTP only: the connector gives the consumer an endpoint and short-lived
  authorization token for an HTTP source. S3 and Azure products are delivered by push.
- **Push to S3 or Azure** needs cloud storage on the **consumer's** connector. When starting a
  transfer, the consumer enters only the bucket and object name, or the storage account,
  container and blob name; the login comes from their connector.
- These are the standard Tractus-X connector features. OpenDS sets only standard connector
  settings and Vault entries.

## Setting it up

**AWS**: region, access key ID, secret access key and the **buckets** the connector uses.
MinIO and Garage are not supported by this integration. Receiving data also requires the IAM
and STS behavior used by the connector.

**Azure**: one or more storage accounts, each with its access key and its **containers**.
Optional, for other Azure clouds such as Azure China: an endpoint template (default
`https://%s.blob.core.windows.net`, where `%s` is the account name).

Products and transfers choose from these buckets and containers, so add a new one here
before using it.

On a platform-hosted connector the keys go into the connector's Vault and the connector is
reconfigured; it keeps its products, offers and agreements. OpenDS never shows the keys
again. Saving without keys keeps the stored ones; removing AWS or an account deletes its keys.
Before saving, OpenDS checks the login: AWS keys must work and belong to an IAM user (not the
root account), each bucket must exist in the chosen region, and each Azure account key must
be accepted and its containers must exist. Nothing is stored when a check fails.

On a **self-hosted** connector the keys never reach OpenDS. Run on the connector's host:

```bash
sudo sh ./cloud-storage.sh aws                      # asks for the access key ID and secret
sudo sh ./cloud-storage.sh azure <account>          # asks for the account key
sudo sh ./cloud-storage.sh azure-endpoint <template>
sudo sh ./cloud-storage.sh remove aws
sudo sh ./cloud-storage.sh remove <account>
sudo sh ./cloud-storage.sh status
```

Then save the same region, buckets, accounts and containers on the Cloud storage tab, without
keys, so product forms and transfers offer them.

## Products

- **S3 source**: one of the connector's buckets, then an **existing object** (its key or path)
  or **upload a new file**. The region comes from the connector.
- **Azure source**: storage account and container from the connector's list, then the file
  in the same way.
- The source types S3 and Azure appear in the product form only when the connector has that
  storage.

## File upload

**Upload a new file** stores the file (up to 100 MB) in the chosen bucket or container under
the path entered in **Save as** (default `opends-uploads/<file name>`). An existing file at
that path is never replaced: the upload is refused and you choose another path. The file
is streamed through OpenDS to storage and is not persistently kept on the platform. On a
self-hosted connector, its agent signs the single upload with the keys on its host and
returns only that signature, valid for a few minutes; the keys never reach OpenDS.

## A restricted AWS account

Use an **IAM user access key** (the connector looks up its own user) in a **dedicated AWS
account** that holds only exchange buckets. To receive into S3, the consumer's connector
creates a short-lived IAM role per transfer (named after the transfer, tagged
`dataspaceconnector:process`), allows it `s3:PutObject` on the target bucket, assumes it, and
deletes it afterwards. That needs IAM rights to create roles, so the login could also create
broader roles. A separate account limits the credentials' reach to resources in the exchange
account.

Permissions the IAM user needs, limited to the exchange buckets (for example `opends-*`):

| Permission                                                    | Needed for                                             |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `s3:GetObject`, `s3:ListBucket`                               | Offering S3 data: reading the source files             |
| `s3:PutObject`                                                | File upload through OpenDS, and receiving data         |
| `s3:CreateBucket`                                             | Receiving into a bucket that does not exist yet        |
| `iam:GetUser` (own user)                                      | Receiving: the connector looks up its own user         |
| `iam:CreateRole`, `iam:TagRole`                               | Receiving: one temporary role per transfer             |
| `iam:PutRolePolicy`, `iam:DeleteRolePolicy`, `iam:DeleteRole` | Receiving: the role's write access, removed afterwards |
| `sts:AssumeRole`                                              | Receiving: using the temporary role                    |

A connector that only offers data needs the first row, plus `s3:PutObject` for file upload.
The IAM rights can be limited to roles tagged `dataspaceconnector:process`. No delete rights
on objects are needed: remove old files yourself. These permissions are verified against AWS:
upload, the checks on save, and receiving into S3.

The same permissions as a policy, to paste into the IAM console's JSON editor (replace
`111122223333` with your account ID, `opends-exchange` with the IAM user's name, and
`opends-*` with your bucket prefix):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CreateTransferRoles",
      "Effect": "Allow",
      "Action": ["iam:CreateRole", "iam:TagRole"],
      "Resource": "arn:aws:iam::111122223333:role/*",
      "Condition": { "Null": { "aws:RequestTag/dataspaceconnector:process": "false" } }
    },
    {
      "Sid": "ManageTransferRoles",
      "Effect": "Allow",
      "Action": ["iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:DeleteRole"],
      "Resource": "arn:aws:iam::111122223333:role/*",
      "Condition": { "Null": { "aws:ResourceTag/dataspaceconnector:process": "false" } }
    },
    {
      "Sid": "FilesAndOwnUser",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "iam:GetUser"],
      "Resource": ["arn:aws:s3:::opends-*/*", "arn:aws:iam::111122223333:user/opends-exchange"]
    },
    {
      "Sid": "BucketsAndTransferRoles",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:CreateBucket", "sts:AssumeRole"],
      "Resource": ["arn:aws:s3:::opends-*", "arn:aws:iam::111122223333:role/*"]
    }
  ]
}
```

## Azure

An account key gives full access to its storage account, so use a **storage account
dedicated to data exchange**. To receive data, the consumer's connector creates the
container if needed and writes with a short-lived SAS token made from the key.

## Known limitations

- After a push into S3, expired short-lived credentials can remain in the connector's Vault.
  The transfer completes and its IAM role is deleted. This is a Tractus-X 0.13 connector
  (EDC 0.17) limitation.
- S3 and Azure sources are delivered by push only; Pull works for HTTP sources.
