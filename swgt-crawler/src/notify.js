// 运行结果推送通知(零依赖):支持 Server酱(微信) / Bark(iOS) / 通用 JSON Webhook
// 配置方式(二选一):
//   环境变量 SWGT_NOTIFY_URL,或 data/notify.json {"url": "..."}
// 不配置则静默跳过;通知失败只打日志,绝不影响爬取流程
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './config.js';

function notifyUrl() {
  if (process.env.SWGT_NOTIFY_URL) return process.env.SWGT_NOTIFY_URL;
  const f = path.join(DATA_DIR, 'notify.json');
  if (existsSync(f)) {
    try { return JSON.parse(readFileSync(f, 'utf8')).url ?? null; } catch { return null; }
  }
  return null;
}

export async function notify(title, content) {
  const url = notifyUrl();
  if (!url) return false;
  try {
    // Server酱:表单 POST
    if (/sctapi\.ftqq\.com/.test(url)) {
      const body = new URLSearchParams({ title, desp: content });
      await fetch(url, { method: 'POST', body });
      return true;
    }
    // Bark:GET 路径式
    if (/api\.day\.app/.test(url)) {
      await fetch(`${url.replace(/\/$/, '')}/${encodeURIComponent(title)}/${encodeURIComponent(content)}`);
      return true;
    }
    // 通用 JSON webhook(企业微信/钉钉/飞书可自行转格式)
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    return true;
  } catch (e) {
    console.log(`notify: 发送失败 ${e.message}`);
    return false;
  }
}
