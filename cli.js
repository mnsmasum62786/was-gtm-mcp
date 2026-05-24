#!/usr/bin/env node
/**
 * WAS GTM MCP — CLI router
 *
 *   was-gtm-mcp           Start the MCP server (used by Claude Desktop via stdio).
 *   was-gtm-mcp auth      Connect with your Google OAuth client + browser sign-in.
 *   was-gtm-mcp logout    Delete the saved credentials.
 *   was-gtm-mcp status    Show whether credentials are saved and when.
 *   was-gtm-mcp help      Show usage.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG_FILE } from './oauth-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || '').toLowerCase();

if (cmd === 'auth') {
  const { runAuthFlow } = await import(join(__dirname, 'auth.js'));
  try {
    await runAuthFlow();
    process.exit(0);
  } catch (err) {
    console.error('\nAuth failed:', err?.message || err);
    process.exit(1);
  }
} else if (cmd === 'logout') {
  const { deleteConfigFile } = await import(join(__dirname, 'auth.js'));
  const deleted = await deleteConfigFile();
  console.log(deleted ? `Removed ${CONFIG_FILE}` : 'No saved credentials to remove.');
  process.exit(0);
} else if (cmd === 'status') {
  const { readConfigFile } = await import(join(__dirname, 'auth.js'));
  const cfg = await readConfigFile();
  if (!cfg) {
    console.log('Not configured. Run `npx -y was-gtm-mcp auth` to connect.');
  } else {
    console.log(`Config: ${CONFIG_FILE}`);
    console.log(`Saved:  ${cfg.saved_at || '(unknown)'}`);
    console.log(`Client: ${cfg.client_id || '(unknown)'}`);
    console.log(`Scopes: ${cfg.scope || '(unknown)'}`);
  }
  process.exit(0);
} else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(`
was-gtm-mcp — GTM MCP server for Claude Desktop / Cursor / any MCP client

Usage:
  was-gtm-mcp           Start the MCP server (used by Claude Desktop via stdio)
  was-gtm-mcp auth      Connect with your Google OAuth client + browser sign-in
  was-gtm-mcp logout    Delete the saved credentials
  was-gtm-mcp status    Show config status
  was-gtm-mcp help      This message

Quick start:
  1. Create a Google Cloud OAuth Desktop client (one-time, ~5 min — README has the steps).
  2. Run:   npx -y was-gtm-mcp auth
     Paste client_id + secret, browser opens for Google sign-in.
  3. Add this to your Claude Desktop config and restart Claude:
       {
         "mcpServers": {
           "gtm": { "command": "npx", "args": ["-y", "was-gtm-mcp"] }
         }
       }

Docs:  https://github.com/mnsmasum62786/was-gtm-mcp
`);
  process.exit(0);
} else if (!cmd) {
  await import(join(__dirname, 'server.js'));
} else {
  console.error(`Unknown command: "${cmd}"\nRun "was-gtm-mcp help" for usage.`);
  process.exit(1);
}
