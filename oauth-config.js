/**
 * OAuth configuration — shared constants only.
 *
 * Each student supplies their own Google Cloud OAuth Desktop client.
 * The auth flow saves their client_id, client_secret, and refresh_token
 * to a single config file under the user's home directory.
 */

import { homedir } from 'node:os';
import { join } from 'node:path';

// Tag Manager scopes — cover every action the 19 MCP tools perform.
export const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/tagmanager.delete.containers',
  'https://www.googleapis.com/auth/tagmanager.manage.users',
  'https://www.googleapis.com/auth/tagmanager.manage.accounts',
];

// Per-user config cache — always under the user's home directory.
export const CONFIG_DIR = join(homedir(), '.was-gtm-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
