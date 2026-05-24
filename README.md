# WAS GTM MCP

Manage Google Tag Manager from Claude Desktop, Cursor, or any MCP-compatible client using natural language. 19 tools cover the full GTM v2 API: accounts, containers, workspaces, tags, triggers, variables, templates, versions, environments, destinations, and more.

100 percent local. Your credentials stay on your machine. Built by [Abdullah Al Masum](https://webanalyticssolution.com) — Web Analytics Solution (WAS). MIT licensed.

## Quick start — 3 steps

### Step 1 — Create your Google Cloud OAuth client (5 min, one-time)

You use your own Google Cloud project for this. That way your API quota is your own, and no credentials are shared.

1. Open https://console.cloud.google.com/apis/library/tagmanager.googleapis.com → click **Enable**
2. Open https://console.cloud.google.com/apis/credentials/consent
   - User type: **External** → Create
   - App name: anything (e.g. "My GTM MCP")
   - User support email: your email
   - Developer contact email: your email → Save
   - Under **Test users**, click **Add Users** and add the Google account you'll sign in with
3. Open https://console.cloud.google.com/apis/credentials
   - **Create credentials → OAuth client ID**
   - Application type: **Desktop app**
   - Name: anything → **Create**
   - Copy the **Client ID** and **Client secret** from the dialog

### Step 2 — Connect with one terminal command

```bash
npx -y github:mnsmasum62786/was-gtm-mcp auth
```

The tool will:

1. Ask you to paste your **Client ID** and **Client secret**
2. Open your browser to Google sign-in
3. After you click **Allow**, save everything to `~/.was-gtm-mcp/config.json` on your machine

That's it for setup. No more typing.

### Step 3 — Add 4 lines to Claude Desktop config

Open the config file:

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Paste this block (merge with any existing `mcpServers`):

```json
{
  "mcpServers": {
    "WAS GTM MCP": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gtm-mcp"]
    }
  }
}
```

No env block, no credentials in the config file. Everything is in `~/.was-gtm-mcp/config.json`.

Fully quit Claude (Cmd+Q on Mac, fully exit on Windows) and reopen. In a new chat:

> "List my GTM accounts"

Done.

## Useful commands

```bash
npx -y github:mnsmasum62786/was-gtm-mcp           # Start the MCP server (Claude Desktop calls this automatically)
npx -y github:mnsmasum62786/was-gtm-mcp auth      # Connect / re-connect with Google
npx -y github:mnsmasum62786/was-gtm-mcp logout    # Delete the saved credentials
npx -y github:mnsmasum62786/was-gtm-mcp status    # Show whether credentials are saved
npx -y github:mnsmasum62786/was-gtm-mcp help      # Usage
```

To switch to a different Google account, run `logout` then `auth` again.

## What you can ask Claude

- "List my GTM accounts"
- "Show all containers in account 1234567"
- "Create a workspace called 'experiment-A' in container GTM-XXXX"
- "List all tags in workspace 1 of container GTM-XXXX"
- "Show me the live version of container GTM-XXXX"
- "Publish version 12 of container GTM-XXXX"
- "Enable the Page URL and Click Element built-in variables in workspace 1"

## All 19 tools

| Tool | Coverage |
|---|---|
| `gtm_account` | list, get, update |
| `gtm_container` | list, get, create, update, delete, snippet, lookup, combine, move_tag_id |
| `gtm_workspace` | list, get, create, update, delete, sync, get_status, quick_preview, resolve_conflict |
| `gtm_tag` | list, get, create, update, delete, revert (GA4, Ads, Stape sGTM, Floodlight, HTML, custom) |
| `gtm_trigger` | list, get, create, update, delete, revert |
| `gtm_variable` | list, get, create, update, delete, revert |
| `gtm_built_in_variable` | list, enable, disable, revert |
| `gtm_folder` | list, get, create, update, delete, revert, move_entities, entities |
| `gtm_client` | sGTM clients — full CRUD + revert |
| `gtm_zone` | full CRUD + revert |
| `gtm_template` | custom templates with .tpl support |
| `gtm_transformation` | server-container transformations |
| `gtm_gtag_config` | Google tag config |
| `gtm_version` | list, get, live, publish, undelete, set_latest, create_from_workspace |
| `gtm_version_header` | list, latest |
| `gtm_environment` | list, get, create, update, delete, reauthorize |
| `gtm_destination` | list, get, link |
| `gtm_user_permission` | list, get, create, update, delete |
| `gtm_raw` | universal escape hatch — call any `tagmanager.v2.*` method by dotted path |

## How it works

The MCP server runs as a local Node.js process on your machine, spawned by Claude Desktop via stdio. It talks directly from your computer to `tagmanager.googleapis.com` using your refresh token. Nothing routes through any third-party server. Your GTM data never leaves your machine except for direct Google API calls.

```
Claude Desktop  →  local Node process (your machine)  →  tagmanager.googleapis.com
```

Each user has their own Google Cloud project + OAuth client. Your API quota is your own, with Google's default limits (250,000 requests/day, 1,500/100s). You can request quota increases for free in Google Cloud Console at any time.

## Security notes

- Credentials live only in `~/.was-gtm-mcp/config.json` on your machine with `0600` permissions
- stdio transport — no inbound HTTP port, no network exposure
- Revoke Google access any time at https://myaccount.google.com/permissions
- Remove the local copy: `npx -y github:mnsmasum62786/was-gtm-mcp logout`

## Troubleshooting

**"App isn't verified" warning during sign-in** — expected because the OAuth client is your own and unverified. Click **Advanced → Go to <your project name> (unsafe)**. It is your own client, so it is safe.

**Auth ran but Claude still says not configured** — fully quit and reopened Claude Desktop? It only reads the config at startup.

**"invalid_grant" error** — your refresh token was revoked or expired. Run `npx -y github:mnsmasum62786/was-gtm-mcp logout` then `npx -y github:mnsmasum62786/was-gtm-mcp auth`.

**"Insufficient Permission" on a specific tool** — your Google account doesn't have the GTM role needed for that operation. Check at https://tagmanager.google.com → admin → user management.

**Want to switch Google accounts** — `npx -y github:mnsmasum62786/was-gtm-mcp logout` then `npx -y github:mnsmasum62786/was-gtm-mcp auth`. New browser sign-in, new account, new token.

**"Google did NOT return a refresh_token"** — Google only sends a refresh token on the first consent for a given OAuth client + Google account combination. Revoke access at https://myaccount.google.com/permissions and re-run auth.

## Advanced — env-var override

Power users can bypass the config file entirely with env vars in Claude Desktop config:

```json
{
  "mcpServers": {
    "WAS GTM MCP": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gtm-mcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REFRESH_TOKEN": "..."
      }
    }
  }
}
```

Any env var present overrides the matching field in `config.json`.

## License

MIT — see `LICENSE`.

## Credits

By [Abdullah Al Masum](https://webanalyticssolution.com), founder of WAS (Web Analytics Solution). Built for the WAS training community and the wider MCP ecosystem.
