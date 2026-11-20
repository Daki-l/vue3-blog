import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const EXPORT_DIR = path.join(DATA_DIR, 'export');
export const LOG_DIR = path.join(DATA_DIR, 'logs');
export const DB_PATH = path.join(DATA_DIR, 'swgt.db');
export const BACKUP_DIR = path.join(DATA_DIR, 'backup');
// 目录外镜像备份(防整个 swgt-crawler 目录被误删时丢失唯一数据副本)
export const MIRROR_BACKUP_DIR = path.join(ROOT, '..', '.swgt-crawler-backup');

export const BASE_URL = 'https://swgt.io';

export const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://swgt.io/',
};

// 请求间隔(毫秒) + 随机抖动:全局相邻两次请求启动的最小间距
// 并发模式下该间距只用于错开启动时刻,吞吐由 并发数/服务器延迟 决定
export const REQUEST_DELAY_MS = 350;
export const JITTER_MS = 150;
export const REQUEST_TIMEOUT_MS = 45000;
export const MAX_RETRIES = 3;

// 单进程并发请求池大小(defenses / images 阶段)
export const DEFENSE_CONCURRENCY = 3;
export const IMAGES_CONCURRENCY = 3;

// 目录页 URL(全部魔灵)
export const CATALOG_URL = '/controllers/tools/monsterCatalog?displayAs=GRID';

// 魔灵详情页模板
export const monsterDetailPath = (com2usId) => `/monsterSearch/?com2usID=${com2usId}`;

// 3MDC 防守详情页模板(按队伍三只魔灵查询;参数顺序敏感,须用页面规范顺序)
export const defenseDetailPath = (leader, m2, m3) =>
  `/3mdc/?monsterLeader=${leader}&monster2=${m2}&monster3=${m3}&usePublic=false`;

// pages 阶段:种子页面 + 允许跟进的链接模式
export const PAGE_SEEDS = [
  '/gameguides/',
  '/controllers/balancePatch/list',
  '/gamecodes/',
  '/3mdcstats/',
  '/faq/',
  '/about/',
  '/discover/',
  '/recruiting/',
  '/leaderboards/siege/',
  '/leaderboards/worldguildbattle/',
  '/leaderboards/labyrinth/',
  '/leaderboards/monsterSubjugation/',
];

export const PAGE_FOLLOW_PATTERNS = [
  /^\/controllers\/gameguides\/[a-zA-Z]+\?[a-zA-Z]+ID=\d+$/,
  /^\/controllers\/balancePatch\/specific\?balancePatchID=\d+$/,
  /^\/faq\/[a-zA-Z0-9?&=/_-]*$/,
];

export const PAGE_MAX = 500;

// 备份保留份数
export const BACKUP_KEEP = 5;
