---
name: Artifact registry vs running workflows
description: listArtifacts() returning empty doesn't mean the app is broken — cross-check with curl/workflow logs before assuming registration is required.
---

On a project that already had valid `.replit-artifact/artifact.toml` files and manually-configured workflows, `listArtifacts()` kept returning `[]` even after restarting the workflow and confirming the app served 200s via curl on its local port.

**Why:** The artifact registry cache/index can be stale or out of sync with actual `artifact.toml` files and workflow configuration, independent of whether the app is actually running and reachable.

**How to apply:** If `listArtifacts()` / `screenshot(type='app_preview')` fail to find an artifact but the workflow shows RUNNING, verify functionality directly with `curl localhost:<port>` and `refresh_all_logs` instead of repeatedly retrying registration-dependent tools. The user's preview pane may still work via the running webview workflow even when the registry API doesn't reflect it.
