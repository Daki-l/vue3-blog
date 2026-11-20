// D1 REST 辅助:直接调 Cloudflare API,绕开 wrangler 的 Windows 崩溃问题
// 用法: node src/d1api.js "SELECT ..." | node src/d1api.js --file xx.sql [--db name]
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ACCOUNT = '8ad62c192c8726be96e0f855ffdb1fe2';
const DB = 'swgt';
const DBS = {
  swgt: '0b2209ba-6cbb-440b-ba2c-fc8252badb24',
  'lnow-site': '2ff18708-18fa-4b9c-a2d0-715313b64aaf',
  'daka-health-history': '7b3b3f6e-9d22-4bd4-a1de-137b160b5c89',
};

function token() {
  const home = process.env.USERPROFILE || process.env.HOME;
  const t = readFileSync(path.join(home, '.wrangler/config/default.toml'), 'utf8');
  return t.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
}

export async function d1Query(sql, dbName = DB) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DBS[dbName]}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    },
  );
  const j = await res.json();
  if (!j.success) {
    throw new Error(`D1 API 失败: ${JSON.stringify(j.errors ?? []).slice(0, 300)}`);
  }
  return j.result?.[0]?.results ?? [];
}

if (process.argv[1] && process.argv[1].endsWith('d1api.js')) {
  const args = process.argv.slice(2);
  let sql = '';
  let dbName = DB;
  if (args[0] === '--file') sql = readFileSync(args[1], 'utf8');
  else sql = args.join(' ');
  const dbIdx = args.indexOf('--db');
  if (dbIdx > -1) dbName = args[dbIdx + 1];
  const rows = await d1Query(sql, dbName);
  console.log(JSON.stringify(rows, null, 1));
}
