---
name: Admin access model
description: The security boundary and invitation behavior for the Moysidis admin console.
---

The existing `ADMIN_PASSWORD` session is the owner account. User administration must remain owner-only; invited accounts authenticate with single-use email links and receive either viewer or editor access.

**Why:** The owner needs to share console access without sharing the owner password, while viewers must never be able to mutate business data.

**How to apply:** Keep role checks server-side. Viewers are read-only, editors can manage practice data but not users, and revocation must invalidate both active sessions and unused invitation links.