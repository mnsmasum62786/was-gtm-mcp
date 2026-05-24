# WAS GTM MCP

Manage Google Tag Manager from Claude Desktop, Cursor, or any MCP-compatible client using natural language. 19 tools cover the full GTM v2 API: accounts, containers, workspaces, tags, triggers, variables, templates, versions, environments, destinations, and more.

100 percent local. Your credentials stay on your machine. Built by [Abdullah Al Masum](https://webanalyticssolution.com) — Web Analytics Solution (WAS). MIT licensed.

## Prerequisites

You need three things installed on your computer. All free, ~5 minutes total if you don't already have them.

| | Required for | How to install |
|---|---|---|
| **Node.js 18 or newer** | running `npx` | Mac: `brew install node` or download from https://nodejs.org · Windows: download installer from https://nodejs.org · Linux: `sudo apt install nodejs npm` |
| **Git** | letting `npx` clone the package from GitHub | Mac: `brew install git` (or just run `git --version` once and macOS will offer to install Xcode Command Line Tools) · Windows: download from https://git-scm.com · Linux: `sudo apt install git` |
| **A terminal** | running the commands below | Mac: open **Terminal.app** (Spotlight → "Terminal") · Windows: open **PowerShell** or **Windows Terminal** · Linux: any terminal emulator |

Quick verification — paste both commands in your terminal:

```bash
node --version   # should print v18.x or newer
git --version    # should print git version 2.x or newer
```

If either prints "command not found", install it using the link above before continuing.

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

## Multi-account setup — connect multiple Google accounts at once

If you manage GTM for several Google accounts (your agency + several clients, for example), you can wire up all of them in one Claude Desktop config. Each account shows up as its own connector.

### How it works

The server checks environment variables before the local config file:

```
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
  ↓ if set in Claude Desktop config "env" block → use those
  ↓ otherwise → read ~/.was-gtm-mcp/config.json
```

So you create one OAuth Desktop client (shared across all accounts), generate one refresh token per Google account, then put each refresh token in its own `mcpServers` entry.

### Step 1 — Create one shared OAuth client (one-time)

Follow Steps 1 from the Quick Start above to create a single OAuth Desktop client in Google Cloud Console. Note your **Client ID** and **Client Secret** — these are shared across all accounts.

### Step 2 — Generate a refresh token for each Google account

For each account you want to connect, repeat this loop:

```bash
# 1. Sign out of all Google accounts in your browser first
#    Open https://accounts.google.com → "Sign out of all accounts"
#    Then sign in to ONLY the account you want to connect now

# 2. Run auth
npx -y github:mnsmasum62786/was-gtm-mcp auth

# 3. Paste your Client ID + Secret when asked
# 4. Browser opens → click Allow → "Connected" page appears
# 5. Read the refresh token from the saved config file
cat ~/.was-gtm-mcp/config.json
```

The output looks like:

```json
{
  "client_id": "604966466270-abc.apps.googleusercontent.com",
  "client_secret": "GOCSPX-shared-secret",
  "refresh_token": "1//0gAccountA-RefreshTokenABC123",
  "saved_at": "..."
}
```

**Copy the `refresh_token` value into a temporary note** and label it (e.g. "Account A — My Agency"). Then repeat steps 1–5 for Account B, Account C, etc.

Important: each `auth` run overwrites `~/.was-gtm-mcp/config.json`, so always copy the refresh token before running auth for the next account.

### Step 3 — Build your Claude Desktop config

After collecting refresh tokens for all accounts, open your Claude Desktop config and paste one `mcpServers` entry per account. Use a clear connector name (the key in quotes) so you can address each one by name in chat.

```json
{
  "mcpServers": {
    "GTM My Agency": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gtm-mcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "604966466270-abc.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-shared-secret",
        "GOOGLE_REFRESH_TOKEN": "1//0gAccountA-RefreshTokenABC123"
      }
    },
    "GTM Client 1": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gtm-mcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "604966466270-abc.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-shared-secret",
        "GOOGLE_REFRESH_TOKEN": "1//0gAccountB-RefreshTokenDEF456"
      }
    },
    "GTM Client 2": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-gtm-mcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "604966466270-abc.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-shared-secret",
        "GOOGLE_REFRESH_TOKEN": "1//0gAccountC-RefreshTokenGHI789"
      }
    }
  }
}
```

Fully quit Claude (Cmd+Q on Mac, fully exit on Windows) and reopen.

### Step 4 — Use them in chat

You'll see three connectors in Claude: **GTM My Agency**, **GTM Client 1**, **GTM Client 2**. Address each one by name:

> "Using GTM My Agency, list my GTM accounts."
> "Using GTM Client 1, show all containers."
> "Using GTM Client 2, create a new workspace called 'experiment-A'."

Claude routes each request to the correct connector and uses the matching refresh token.

### Multi-account gotchas

| Problem | Fix |
|---|---|
| Browser keeps signing into the same Google account | Sign out of all accounts at https://accounts.google.com before each `auth` run |
| "Google did not return a refresh_token" on 2nd account | You already authorized this OAuth client with that account before. Revoke at https://myaccount.google.com/permissions, then re-run |
| Forgot to copy a refresh token before running the next auth | Re-run auth for that account — you get a fresh token. The previous one is auto-revoked |
| One connector fails but others work | Open `claude_desktop_config.json` and check that account's `GOOGLE_REFRESH_TOKEN` isn't truncated or has stray quotes |

## Advanced — single-account env-var override

If you have only one account but still want to keep credentials in Claude Desktop config (instead of `~/.was-gtm-mcp/config.json`), use the same env-var block with one entry:

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

Any env var present overrides the matching field in `config.json`. You can also delete `~/.was-gtm-mcp/config.json` since env vars fully replace it.

## License

MIT — see `LICENSE`.

## Credits

By [Abdullah Al Masum](https://webanalyticssolution.com), founder of WAS (Web Analytics Solution). Built for the WAS training community and the wider MCP ecosystem.
