---
title: Cloud storage
---

# Cloud storage

Connectors can use data stored in Amazon S3 or Azure Blob Storage as product sources and
receive transferred data in their own buckets or containers. Storage keys are configured once
per connector, rather than for each product, by a connector Manager on the connector's
**Cloud storage** tab.

## Supported transfer types

| Source of the product | Pull (download link) | Push to HTTP             | Push to S3 | Push to Azure |
| --------------------- | -------------------- | ------------------------ | ---------- | ------------- |
| HTTP                  | yes                  | yes                      | yes        | yes           |
| S3                    | no                   | yes                      | yes        | yes           |
| Azure Blob            | no                   | yes                      | yes        | yes           |

- **Pull**: available for HTTP sources only. The connector gives the consumer an endpoint and
  a short-lived token. S3 and Azure products are delivered by push.
- **Push to S3 or Azure**: requires cloud storage on the consumer's connector. The consumer
  only enters the bucket and object name, or the storage account, container and blob name.
  The keys come from their connector.

## Setting it up

Before you create keys, read [AWS account and permissions](#aws-account-and-permissions) and
[Azure](#azure) below. Then, on the connector's **Cloud storage** tab, set up one or both
providers:

- **AWS**: enter the region, access key ID and secret access key, then select the
  **buckets** the connector can use. S3-compatible services such as MinIO and Garage are not
  supported.
- **Azure**: add one or more storage accounts, each with its access key, and select the
  **containers** the connector can use. For other Azure clouds, such as Azure China, you can
  configure an endpoint template. The default is `https://%s.blob.core.windows.net`, where
  `%s` is replaced by the account name.

Products and transfers can use only the buckets and containers configured here. Add a bucket
or container before selecting it in a product or transfer.

### Platform-hosted connectors

- The keys are stored in the connector's Vault. Saving them does not affect existing products,
  offers or agreements.
- OpenDS never shows saved keys again. Saving without entering new keys keeps the stored ones,
  and removing AWS or an account deletes its keys.
- Before saving, OpenDS validates the keys and the storage configuration:
  - AWS keys must be valid and belong to an IAM user, not the root account.
  - Each S3 bucket must exist in the selected region.
  - Each Azure account key must be accepted, and its configured containers must exist.
- If validation fails, nothing is stored.

### Self-hosted connectors

The keys never reach OpenDS. Configure them directly on the connector's host:

```bash
sudo sh ./cloud-storage.sh aws                      # asks for the access key ID and secret
sudo sh ./cloud-storage.sh azure <account>          # asks for the account key
sudo sh ./cloud-storage.sh azure-endpoint <template>
sudo sh ./cloud-storage.sh remove aws
sudo sh ./cloud-storage.sh remove <account>
sudo sh ./cloud-storage.sh status
```

Then save the same region, buckets, accounts and containers on the **Cloud storage** tab
without keys, so that product forms and transfers offer them.

## Products

- **S3 source**: select one of the connector's configured buckets. Then select an existing
  object by its key or path, or choose **Upload a new file**. The region is taken from the
  connector's configuration.
- **Azure source**: select a configured storage account and container, then select an
  existing file or upload a new one.

The source types Amazon S3 and Azure Blob Storage appear in the product form only when the
connector has that storage configured.

## File upload

**Upload a new file** stores a file of up to 100 MB in the selected bucket or container, using
the path entered in **Save as**. The default path is `opends-uploads/<file name>`.

An existing file at that path is never overwritten. If the path is already in use, the upload
is refused and you must choose another path.

The file passes through OpenDS to the storage provider but is not kept by OpenDS. For
self-hosted connectors, the agent authorizes the upload using the keys on the connector's
host, so the keys never reach OpenDS.

## AWS account and permissions

Use an **IAM user access key** in a **dedicated AWS account** that holds only the exchange
buckets. To receive data into S3, the consumer's connector creates a short-lived IAM role for
each transfer, tagged `dataspaceconnector:process`. It uses the role to write to the target
bucket and deletes it afterwards. Because this requires the right to create roles, a separate
account limits what the credentials can reach.

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

A connector that only offers data needs the first row, plus `s3:PutObject` for file uploads.
The IAM rights can be limited to roles tagged `dataspaceconnector:process`. OpenDS never
deletes objects in S3 or Azure, so delete rights are not needed and old files must be removed
by hand.

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
dedicated to data exchange**. To receive data, the consumer's connector creates the container
if needed and writes with a short-lived SAS token derived from the key.
