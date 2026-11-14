---
id: organization
title: Organization and team
---

# Organization and team

## Joining

- **Register**: when the platform allows self-registration, create an account and an
  organization from the sign-up page, and accept the dataspace's participation terms (the
  link in the form opens them). A platform administrator approves the organization before
  it can use the dataspace. If registration is closed, ask to be invited.
- **Be invited**: an owner or administrator adds you as a member. If an account already uses
  your email, it joins the organization with its own name and password once you accept. The
  invitation email contains a code, and accepting asks for it. This prevents somebody else who
  signed up with your address from joining in your place. Without email, the inviter is shown
  the code once and passes it on. You can decline an invitation or leave an organization at any
  time, unless you are its last Owner; appoint another Owner first. Your account stays.

A new account gets an email with a link to choose a password, valid for seven days. Only the
latest link works: requesting a password reset replaces an unused invitation link.

If the platform has no email server set up, members cannot reset passwords and inviters set the
initial password themselves.

Until an administrator approves your organization you can sign in and look around, but not
exchange data; a notice at the top says whether it is awaiting approval, rejected or
suspended. An owner or administrator can remove a member; the account stays and keeps its
other organizations.

## Your profile

Open the menu under your name and choose **Edit profile** to change your name or password.
A new password needs at least 16 characters and your current password. Changing it signs
out every session of your account, this one included, so sign in again with the new
password. After five wrong passwords in a row the account is locked for ten minutes.

## Organization details

Under **Organization** you describe what your organization shares or uses in the dataspace.
Partners see this description. The organization directory shows signed-in members the approved
organizations of their dataspace, including name, BPN, DID and the DSP addresses of running
connectors, but never any user data. Owners and administrators also manage:

- **Members** and their roles, on the same page, and the **Organization settings** (access
  requests and activity tracking).
- **Connector access**: on a connector's page, grant a member Manager or Viewer rights on that
  connector, and revoke them.
- **Partner groups** and the **Organization activity** log, each on its own page in the
  sidebar.

Usage purposes are not set per organization: the platform administrator defines the list for
the whole dataspace, and providers choose from it in usage policies.

Every member can create their own API key for scripts under **API access**
([API and permissions](/reference/api)). Creating it asks for your password and an expiry (30
days, 90 days, one year or never); the key is shown only once. A key acts as you, with your
roles. **Replace key** makes the old key stop working; **Revoke key** removes it.

## Identity

Your organization's identity (test, managed or self-hosted), how to change it and how to
rotate its STS secret: [Identity](/guide/identity).
