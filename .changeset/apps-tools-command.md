---
"@executor-js/app-management": minor
"@executor-js/app-templates": patch
---

`executor apps tools --app <slug or ID>` lists a deployed app's tools as the host evaluates them,
without schemas: each tool's name, description, `readOnly`, `kindConfirmed` and annotations, and the
accounts the listing used. A script can check which tools are reads and which are writes the way the
other `executor apps` commands work, with the CLI's own sign-in, instead of handling the local API
key or an MCP client. It reads `/v1/tools/index` on the local server and the app's tool index on
hosted Executor.

The app-authoring skill's deploy guide suggests it after each deploy.
