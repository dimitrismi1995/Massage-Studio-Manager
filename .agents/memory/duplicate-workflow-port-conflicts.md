---
name: Duplicate workflow port conflicts
description: How to recognize and fix EADDRINUSE workflow failures caused by legacy manually-named workflows duplicating artifact-native ones.
---

Some repls (especially ones set up before the artifact registration system, or where an earlier agent manually added `[[workflows.workflow]]` entries to `.replit`) end up with two sets of workflows targeting the same service on the same port:

- Legacy custom-named workflows defined directly in `.replit` (e.g. "API Server", "My App") running the same `pnpm --filter ... run dev` command.
- Artifact-native workflows auto-generated from each `artifacts/<slug>/.replit-artifact/artifact.toml` (named like `artifacts/<slug>: <service>`), which read the canonical port from the toml's `[[services]]` block.

When both are running, whichever starts second fails with `EADDRINUSE: address already in use`.

**Why:** The artifact system now owns workflow lifecycle via `artifact.toml`; hand-rolled `.replit` workflow blocks from before that system (or added by mistake) become stale duplicates that silently conflict only when both happen to run together.

**How to apply:** If you see `EADDRINUSE` or `Port already in use` in workflow logs, check `listWorkflows()` for near-duplicate names bound to the same port. Keep the artifact-native ones (`artifacts/<slug>: <service>`) since they track `artifact.toml`, and remove the legacy custom-named ones with `removeWorkflow({ name })`. Then restart the artifact-native workflows.
