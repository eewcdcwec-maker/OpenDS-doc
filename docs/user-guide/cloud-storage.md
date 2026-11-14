---
title: Cloud storage
---

# Cloud storage

Connectors can offer data stored in Amazon S3 or Azure Blob Storage and receive data into
their own bucket or container. The storage keys are set once per connector rather than per
product, by a connector Manager on the connector's **Cloud storage** tab.

## Supported transfer types

| Source of the product | Pull (download link) | Push to an HTTP endpoint | Push to S3 | Push to Azure |
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

Before you create keys, read [A restricted AWS account](#a-restricted-aws-account) and
[Azure](#azure) below. Then, on the connector's **Cloud storage** tab, set up one or both
providers:

- **AWS**: the region, access key ID, secret access key and the **buckets** the connector
  uses. S3-compatible services such as MinIO or Garage are not supported.
- **Azure**: one or more storage accounts, each with its access key and its **containers**.
  For other Azure clouds, such as Azure China, an endpoint template can be set (default
  `https://%s.blob.core.windows.net`, where `%s` is the account name).

Products and transfers choose from these buckets and containers, so a new one must be added
here before it can be used.

On a platform-hosted connector, the keys are stored in the connector's Vault. Saving them does
not affect its products, offers or agreements. OpenDS never shows the keys again. Saving without keys keeps
the stored ones. Removing AWS or an account deletes its keys. Before saving, OpenDS
checks that the AWS keys work and belong to an IAM user rather than the root account, that each
bucket exists in the chosen region, and that each Azure account key is accepted and its
containers exist. Nothing is stored when a check fails.

On a **self-hosted** connector, the keys never reach OpenDS and are set on the connector's
host:

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

- **S3 source**: one of the connector's buckets, then either an **existing object** with its
  key or path, or **upload a new file**. The region comes from the connector.
- **Azure source**: a storage account and container from the connector's list, then the file
  in the same way.

The product kinds Amazon S3 and Azure Blob appear in the product form only when the connector has that
storage configured.

## File upload

**Upload a new file** stores a file of up to 100 MB in the chosen bucket or container under
the path entered in **Save as** (default `opends-uploads/<file name>`). An existing file at
that path is never replaced: the upload is refused and you choose another path. The file is
passed through OpenDS to the storage without being kept on the platform. On a self-hosted
connector, the agent authorizes the upload with the keys on its host, so the keys never reach
OpenDS.

## A restricted AWS account

Use an **IAM user access key** in a **dedicated AWS account** that holds only the exchange
buckets. To receive data into S3, the consumer's connector creates a short-lived IAM role for
each transfer, tagged `dataspaceconnector:process`. It uses the role to write to the target
bucket and deletes it afterwards. Because this requires the right to create roles, a separate account
limits what the credentials can reach.

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
The IAM rights can be limited to roles tagged `dataspaceconnector:process`. Delete rights on
objects are not needed, so old files must be removed manually.

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

## Known limitations

After a push into S3, expired short-lived credentials can remain stored on the connector. This
is a limitation of the connector runtime. The transfer still completes and its IAM role is
deleted.
