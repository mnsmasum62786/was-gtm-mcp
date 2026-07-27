# Changelog

## 3.0.2 — 2026-07-24

### Fixes

- **Windows browser open — URL truncation bug.** `openBrowser()` on Windows used `cmd /c start "" URL` where `cmd` treated `&`, `?`, `=` in the OAuth URL as shell metacharacters. Result: the browser opened a truncated URL missing `response_type`, `client_id`, `scope`, etc., causing Google to return `Access blocked: Required parameter is missing: response_type`. Now the URL is wrapped in double quotes so cmd passes it through intact.


## 3.0.1 — 2026-07-24

### Fixes

- **Windows Node 24+ compatibility** — wrap dynamic `import()` calls in `pathToFileURL().href` to fix `ERR_UNSUPPORTED_ESM_URL_SCHEME` when the module path starts with a Windows drive letter (e.g. `C:\Users\...`). Node 24's strict ESM loader was interpreting `C:` as a URL protocol. No behavior change — same auth flow, just now works on Windows.


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
