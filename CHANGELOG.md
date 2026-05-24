# Changelog

## 3.0.0 — 2026-05-24

Initial public release.

- 19 GTM v2 API tools: accounts, containers, workspaces, tags, triggers, variables, built-in variables, folders, clients, zones, templates, transformations, gtag config, versions, version headers, environments, destinations, user permissions
- Universal `gtm_raw` escape hatch for any `tagmanager.v2.*` method
- Bring-your-own Google Cloud OAuth Desktop client
- Browser-based OAuth flow with loopback redirect — no copy-paste of codes
- Credentials saved to `~/.was-gtm-mcp/config.json` (mode 0600)
- Claude Desktop config requires only the `command` + `args` block — no credentials
- stdio transport — 100% local, no network exposure
- CLI: `was-gtm-mcp auth | logout | status | help`
- Cross-platform: Mac, Linux, Windows
