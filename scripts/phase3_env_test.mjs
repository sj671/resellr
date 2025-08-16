#!/usr/bin/env node

/**
 * Snapflip — Phase 3 Env & OAuth URL Test Script
 *
 * Purpose:
 * - Validate required eBay OAuth env vars
 * - Build and print the correct authorize URL for sandbox/production
 * - Optionally simulate (mock) a token exchange flow for local testing
 * - Provide a lightweight self-test that asserts URL building across environments
 *
 * Usage:
 *   node scripts/phase3_env_test.mjs --help
 *   node scripts/phase3_env_test.mjs --print-url [--state myState123] [--env-file .env.local]
 *   node scripts/phase3_env_test.mjs --mock
 *   node scripts/phase3_env_test.mjs --self-test
 *
 * Required env variables:
 *   EBAY_ENV             sandbox | production
 *   EBAY_APP_ID          eBay App ID (Client ID)
 *   EBAY_CERT_ID         eBay Cert ID (Client Secret) — validated but not used for URL
 *   EBAY_RU_NAME         Redirect URL name (RuName) from your eBay app settings (Sandbox/Production)
 *   EBAY_SCOPE           Space-delimited scope string (start with https://api.ebay.com/oauth/api_scope)
 *   EBAY_AUTH_BASE_URL   (optional) override; inferred from EBAY_ENV if unset
 *
 * Where to get these:
 *   1) Create/Sign in to an eBay Developer account (developer.ebay.com) and create an application.
 *   2) Find your Keys:
 *      - Sandbox keys: use for EBAY_ENV=sandbox
 *      - Production keys: use for EBAY_ENV=production
 *      EBAY_APP_ID = Client ID, EBAY_CERT_ID = Client Secret
 *   3) Configure OAuth Redirect URL in your app settings. Copy the exact Redirect URL name (RuName) into EBAY_RU_NAME.
 *   4) Choose scopes in your app:
 *      Start with "https://api.ebay.com/oauth/api_scope" and add additional Sell API scopes as needed.
 *   5) Leave EBAY_AUTH_BASE_URL unset unless you need to override the auth endpoint.
 *
 * Quickstart (sandbox):
 *   export EBAY_ENV=sandbox
 *   export EBAY_APP_ID=YOUR_APP_ID
 *   export EBAY_CERT_ID=YOUR_CERT_ID
 *   export EBAY_RU_NAME=YOUR_SANDBOX_RUNAME
 *   export EBAY_SCOPE="https://api.ebay.com/oauth/api_scope"
 *   node scripts/phase3_env_test.mjs --print-url
 *
 * Local redirects during development:
 *   Use a public HTTPS tunnel to your localhost so the eBay redirect can reach your app.
 *   - Cloudflared: `cloudflared tunnel --url http://localhost:3000` → use printed https URL
 *   - ngrok: `ngrok http 3000` → use printed https URL
 *   Then update the Redirect URL (the actual HTTPS URL) inside your eBay developer app settings for the RuName you use. The `redirect_uri` parameter in the authorize URL remains the RuName value (EBAY_RU_NAME).
 * Notes:
 * - This script is non-interactive. It exits non-zero on validation failure.
 */

import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { URL, URLSearchParams } from 'node:url';

function printHeader() {
  console.log('Snapflip — Phase 3 Env & OAuth URL Test Script');
}

function printHelp() {
  printHeader();
  console.log(`\nCommands:\n  --help            Show this help\n  --print-url       Validate env and print the authorize URL\n  --mock            Run a mock token exchange flow (no real network)\n  --self-test       Run internal assertions for URL building\n  --state <value>   Optional state parameter to include in the URL\n  --env-file <p>    Load env vars from a file (e.g., .env.local). If omitted, auto-loads .env.local/.env when present\n`);
  console.log('Required env: EBAY_ENV, EBAY_APP_ID, EBAY_CERT_ID, EBAY_RU_NAME, EBAY_SCOPE, [EBAY_AUTH_BASE_URL optional]');
}

function getArgs(argv) {
  const args = { printUrl: false, mock: false, selfTest: false, state: undefined, help: false, envFile: undefined };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token === '--print-url') {
      args.printUrl = true;
    } else if (token === '--mock') {
      args.mock = true;
    } else if (token === '--self-test') {
      args.selfTest = true;
    } else if (token === '--state') {
      args.state = argv[i + 1];
      i += 1;
    } else if (token === '--env-file') {
      args.envFile = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function tryLoadEnvFromFile(envFilePath) {
  if (!envFilePath) return false;
  const resolved = path.isAbsolute(envFilePath)
    ? envFilePath
    : path.resolve(process.cwd(), envFilePath);
  if (!fs.existsSync(resolved)) return false;
  const raw = fs.readFileSync(resolved, 'utf8');
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = /^([A-Z0-9_\.]+)\s*=\s*(.*)$/.exec(trimmed);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Basic variable expansion ${VAR}
    value = value.replace(/\$\{([A-Z0-9_\.]+)\}/g, (_, varName) => process.env[varName] ?? '');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return true;
}

function autoLoadEnv(args) {
  // 1) explicit file via flag
  if (args.envFile) {
    const ok = tryLoadEnvFromFile(args.envFile);
    if (!ok) {
      throw new Error(`--env-file not found or unreadable: ${args.envFile}`);
    }
    return;
  }
  // 2) auto-load common files if present
  const candidates = [
    '.env.local',
    '.env',
    '.env.development.local',
  ];
  for (const candidate of candidates) {
    if (tryLoadEnvFromFile(candidate)) {
      return;
    }
  }
}

function assertEnv(name, predicate = (v) => v && v.length > 0, hint = '') {
  const value = process.env[name];
  if (!predicate(value)) {
    const hintText = hint ? `\nHint: ${hint}` : '';
    throw new Error(`Missing or invalid env: ${name}${hintText}`);
  }
  return value;
}

function validateEnv() {
  const env = assertEnv('EBAY_ENV', (v) => v === 'sandbox' || v === 'production', 'Set EBAY_ENV to "sandbox" or "production".');
  const appId = assertEnv('EBAY_APP_ID');
  const certId = assertEnv('EBAY_CERT_ID');
  const ruName = assertEnv('EBAY_RU_NAME');
  const scope = assertEnv('EBAY_SCOPE');
  const authBase = process.env.EBAY_AUTH_BASE_URL || (env === 'sandbox'
    ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
    : 'https://auth.ebay.com/oauth2/authorize');
  // quick sanity for override
  if (process.env.EBAY_AUTH_BASE_URL) {
    assert.match(process.env.EBAY_AUTH_BASE_URL, /^https?:\/\//i, 'EBAY_AUTH_BASE_URL must be a valid URL if set.');
  }

  return { env, appId, certId, ruName, scope, authBase };
}

function buildAuthorizeUrl({ authBase, appId, ruName, scope, state }) {
  const url = new URL(authBase);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: appId,
    redirect_uri: ruName,
    scope,
    state: state || crypto.randomBytes(12).toString('hex'),
  });
  url.search = params.toString();
  return url.toString();
}

async function runMockExchange() {
  printHeader();
  console.log('\nRunning mock token exchange...');
  const { env, appId, certId, ruName, scope, authBase } = validateEnv();
  const url = buildAuthorizeUrl({ authBase, appId, ruName, scope });
  console.log('\nAuthorize URL (mock):');
  console.log(url);

  // Simulate that user returned with a ?code= value
  const mockCode = 'MOCK_AUTH_CODE_' + crypto.randomBytes(4).toString('hex');
  console.log(`\nSimulating callback with code=${mockCode}`);

  // Simulate token exchange output
  const now = Date.now();
  const mockResponse = {
    access_token: 'MOCK_ACCESS_' + crypto.randomBytes(8).toString('hex'),
    expires_in: 7200,
    refresh_token: 'MOCK_REFRESH_' + crypto.randomBytes(12).toString('hex'),
    token_type: 'Bearer',
    scope,
    obtained_at: new Date(now).toISOString(),
    access_token_expires_at: new Date(now + 7200 * 1000).toISOString(),
    meta: { env, appId, certId, redirectUri },
  };

  console.log('\nMock token exchange result:');
  console.log(JSON.stringify(mockResponse, null, 2));
  console.log('\nMock flow complete.');
}

function selfTest() {
  printHeader();
  console.log('\nRunning self-test...');

  const baseSandbox = 'https://auth.sandbox.ebay.com/oauth2/authorize';
  const baseProd = 'https://auth.ebay.com/oauth2/authorize';
  const appId = 'APP-ID-TEST';
  const ruName = 'RUNAME-TEST-STRING';
  const scope = 'https://api.ebay.com/oauth/api_scope';

  const urlSandbox = buildAuthorizeUrl({ authBase: baseSandbox, appId, ruName, scope, state: 's1' });
  const urlProd = buildAuthorizeUrl({ authBase: baseProd, appId, ruName, scope, state: 's2' });

  assert.ok(urlSandbox.startsWith(baseSandbox + '?'));
  assert.ok(urlProd.startsWith(baseProd + '?'));

  const qsSandbox = new URL(urlSandbox).searchParams;
  const qsProd = new URL(urlProd).searchParams;

  assert.equal(qsSandbox.get('response_type'), 'code');
  assert.equal(qsSandbox.get('client_id'), appId);
  assert.equal(qsSandbox.get('redirect_uri'), ruName);
  assert.equal(qsSandbox.get('scope'), scope);
  assert.equal(qsSandbox.get('state'), 's1');

  assert.equal(qsProd.get('response_type'), 'code');
  assert.equal(qsProd.get('client_id'), appId);
  assert.equal(qsProd.get('redirect_uri'), ruName);
  assert.equal(qsProd.get('scope'), scope);
  assert.equal(qsProd.get('state'), 's2');

  console.log('Self-test passed.');
}

async function run() {
  const args = getArgs(process.argv);
  if (args.help || (!args.printUrl && !args.mock && !args.selfTest)) {
    printHelp();
    process.exit(0);
  }

  // Attempt to load env from file(s) before using any env
  try {
    autoLoadEnv(args);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }

  if (args.printUrl) {
    printHeader();
    const { env, appId, certId, ruName, scope, authBase } = validateEnv();
    const url = buildAuthorizeUrl({ authBase, appId, ruName, scope, state: args.state });
    console.log(`\nEnv valid. EBAY_ENV=${env}`);
    console.log('\nAuthorize URL:');
    console.log(url);
    process.exit(0);
  }

  if (args.mock) {
    try {
      await runMockExchange();
      process.exit(0);
    } catch (err) {
      console.error(err.message || err);
      process.exit(1);
    }
  }

  if (args.selfTest) {
    try {
      selfTest();
      process.exit(0);
    } catch (err) {
      console.error(err.message || err);
      process.exit(1);
    }
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
