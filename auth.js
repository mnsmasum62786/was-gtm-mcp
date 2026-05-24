/**
 * Browser-based OAuth flow with student's own OAuth Desktop client.
 *
 * Walks the student through:
 *   1. Prompt for GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (or reads from env)
 *   2. Spawn a local HTTP listener on a random loopback port
 *   3. Open the default browser to Google sign-in
 *   4. Capture the redirect, exchange the code for a refresh token
 *   5. Save {client_id, client_secret, refresh_token} to ~/.was-gtm-mcp/config.json (0600)
 *
 * Designed to be run from a terminal: `npx -y was-gtm-mcp auth`.
 */

import { createServer } from 'node:http';
import { mkdir, writeFile, chmod, readFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { google } from 'googleapis';
import { SCOPES, CONFIG_DIR, CONFIG_FILE } from './oauth-config.js';

function openBrowser(url) {
  const cmds = {
    darwin: { cmd: 'open', args: [url] },
    linux: { cmd: 'xdg-open', args: [url] },
    win32: { cmd: 'cmd', args: ['/c', 'start', '""', url] },
  };
  const c = cmds[process.platform];
  if (!c) {
    console.error(`Unsupported platform: ${process.platform}. Open this URL manually:\n${url}`);
    return;
  }
  try {
    const child = spawn(c.cmd, c.args, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch (err) {
    console.error(`Couldn't auto-open browser (${err.message}). Open this URL manually:\n${url}`);
  }
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WAS GTM MCP — Connected</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}
h1{font-size:24px;margin:0 0 16px}.box{background:#f3f7f4;border:1px solid #c8e0d2;border-radius:10px;padding:24px}
p{margin:0 0 12px}.ok{color:#0a7f3f;font-weight:600}</style></head>
<body><div class="box"><h1>Connected to Google Tag Manager</h1>
<p class="ok">Authorization successful.</p>
<p>Your credentials have been saved locally on your machine. You can close this tab and return to your terminal.</p>
</div></body></html>`;

const ERROR_HTML = (msg) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WAS GTM MCP — Error</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}
h1{font-size:24px;margin:0 0 16px;color:#b03030}.box{background:#fdf2f2;border:1px solid #e8c4c4;border-radius:10px;padding:24px}</style></head>
<body><div class="box"><h1>Authorization failed</h1><p>${msg}</p><p>Return to the terminal and try again.</p></div></body></html>`;

export async function runAuthFlow() {
  console.log('\n=== WAS GTM MCP — Browser sign-in ===\n');

  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('You need a Google Cloud OAuth client first. Quick setup (5 min, one-time):');
    console.log('  1. Open: https://console.cloud.google.com/apis/library/tagmanager.googleapis.com');
    console.log('     Click ENABLE to turn on the Tag Manager API for your project.');
    console.log('  2. Open: https://console.cloud.google.com/apis/credentials/consent');
    console.log('     User type: External  -> fill app name + your email -> Save.');
    console.log('     Under Test users, add your own Google email.');
    console.log('  3. Open: https://console.cloud.google.com/apis/credentials');
    console.log('     Create credentials -> OAuth client ID -> Application type: Desktop app -> Create.');
    console.log('     Copy the Client ID and Client secret from the dialog.\n');

    const rl = readline.createInterface({ input, output });
    if (!clientId)     clientId     = (await rl.question('Paste your GOOGLE_CLIENT_ID: ')).trim();
    if (!clientSecret) clientSecret = (await rl.question('Paste your GOOGLE_CLIENT_SECRET: ')).trim();
    rl.close();
  }

  if (!clientId || !clientSecret) {
    throw new Error('Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
  }

  // Local loopback HTTP listener — random port — receives the OAuth code from Google.
  const state = randomBytes(16).toString('hex');
  let resolveCode, rejectCode;
  const codePromise = new Promise((res, rej) => { resolveCode = res; rejectCode = rej; });

  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname !== '/callback') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const returnedState = u.searchParams.get('state');
    const code = u.searchParams.get('code');
    const error = u.searchParams.get('error');
    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(ERROR_HTML(`Google reported: ${error}`));
      rejectCode(new Error(`OAuth error: ${error}`));
      return;
    }
    if (returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(ERROR_HTML('State mismatch — possible CSRF. Please re-run auth.'));
      rejectCode(new Error('State mismatch'));
      return;
    }
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(ERROR_HTML('No code returned by Google.'));
      rejectCode(new Error('No code'));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(SUCCESS_HTML);
    resolveCode(code);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });

  console.log('\nOpening your browser to Google sign-in...');
  console.log('If it does not open automatically, copy and paste this URL:\n');
  console.log(authUrl + '\n');
  console.log('Waiting for you to approve in the browser...');

  openBrowser(authUrl);

  let code;
  try {
    code = await Promise.race([
      codePromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('Timed out waiting for browser sign-in (5 min).')), 5 * 60 * 1000)),
    ]);
  } finally {
    server.close();
  }

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh_token. This happens if you previously authorized this OAuth client.\n' +
      'Revoke access at https://myaccount.google.com/permissions and re-run auth.',
    );
  }

  // Persist {client_id, client_secret, refresh_token} to ~/.was-gtm-mcp/config.json (0600).
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    saved_at: new Date().toISOString(),
  };
  await writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  try { await chmod(CONFIG_FILE, 0o600); } catch {}

  console.log(`\nSaved credentials to ${CONFIG_FILE}`);
  console.log('\nLast step — add this to your Claude Desktop config and restart Claude:\n');
  console.log(JSON.stringify({
    mcpServers: {
      gtm: {
        command: 'npx',
        args: ['-y', 'was-gtm-mcp'],
      },
    },
  }, null, 2));
  console.log('\nClaude Desktop config location:');
  console.log('  Mac:     ~/Library/Application Support/Claude/claude_desktop_config.json');
  console.log('  Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
  console.log('\nAfter restarting Claude, ask: "List my GTM accounts".\n');
}

export async function readConfigFile() {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteConfigFile() {
  try {
    await unlink(CONFIG_FILE);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
