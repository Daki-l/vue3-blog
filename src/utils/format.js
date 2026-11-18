/**
 * 时间格式化工具
 * 后端 D1 的 datetime('now') 与 ISO 时间戳均按 UTC 存储,展示统一转为北京时间。
 * 纯日期(YYYY-MM-DD)原样返回,不补零点。
 */

function pad(n) {
    return String(n).padStart(2, '0');
}

/** 完整时间 yyyy-MM-dd HH:mm:ss;UTC -> 北京时间 */
export function formatDateTime(value, fallback = '-') {
    if (value === null || value === undefined || value === '') return fallback;
    let str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str; // 纯日期不转换
    str = str.replace('T', ' ').replace('Z', '').replace(/\.\d+/, '');
    const d = new Date(`${str}Z`); // 按 UTC 解析
    if (isNaN(d.getTime())) return str;
    const bj = new Date(d.getTime() + 8 * 3600 * 1000);
    return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`;
}

/** 仅日期 yyyy-MM-dd */
export function formatDate(value, fallback = '-') {
    const full = formatDateTime(value, fallback);
    return full === fallback ? full : full.slice(0, 10);
}
