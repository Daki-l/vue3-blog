// CLI 入口:node src/cli.js <stage> [options]
// stage: catalog|monsters|defenses|pages|images|rediscover|update|backup|restore|stats|export|exportd1|all
import {
  stageCatalog, stageMonsters, stageDefenses, stagePages, stageStats, stageRediscover,
} from './crawl.js';
import { stageImages } from './images.js';
import { runExport } from './exportJson.js';
import { runExportD1 } from './exportD1.js';
import { stageBackup } from './backup.js';
import { stageRestore } from './restoreFromD1.js';

const args = process.argv.slice(2);
const stage = args[0] ?? 'help';
const opts = {};
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--limit') opts.limit = Number(args[++i]);
  else if (args[i] === '--fresh') opts.fresh = true;
  else if (args[i] === '--refresh') opts.refresh = true;
  else if (args[i] === '--since') opts.since = args[++i];
}

const HELP = `
用法: node src/cli.js <stage> [options]

阶段:
  catalog      抓取魔灵目录,写入 monsters 基础信息
  monsters     抓取未完成的魔灵详情页
  defenses     处理防守队列(全部克制/评分/攻略)
  pages        存档公开页面(攻略/平衡补丁/兑换码/统计等)
  images       下载图片资产到 data/images/(增量,已有即跳过)
  rediscover   用本地缓存重建防守队列(不发网络请求)

增量更新(推荐日常使用):
  update       = catalog(强刷) -> monsters --refresh -> defenses(只抓变化的)
                 -> pages -> images -> backup -> export
               monsters --refresh 用页面上 "N COUNTERS" 与库内 counter_count
               比对,只有克制数变化/新出现的防守才会重抓

备份/恢复:
  backup       SQLite 快照 -> data/backup/ + 目录外 ../.swgt-crawler-backup/
  restore      从 D1 远程库恢复本地数据库(误删后使用)

导出:
  stats        数据库统计
  export       导出 JSON 快照到 data/export/
  exportd1     生成 D1 导入 SQL(全量,INSERT OR REPLACE 可重复执行)
               --since "ISO时间" 只导出该时间之后变更的行(增量推 D1)
  all          全量爬取(首次或重建用)

选项:
  --limit N / --fresh / --refresh / --since
`;

async function main() {
  switch (stage) {
    case 'catalog':
      await stageCatalog(opts);
      break;
    case 'monsters':
      await stageMonsters(opts);
      break;
    case 'defenses':
      await stageDefenses(opts);
      break;
    case 'pages':
      await stagePages(opts);
      break;
    case 'images':
      await stageImages(opts);
      break;
    case 'rediscover':
      await stageRediscover();
      break;
    case 'update': {
      await stageCatalog({ fresh: true });
      await stageMonsters({ refresh: true, limit: opts.limit });
      await stageDefenses(opts);
      await stagePages(opts);
      await stageImages(opts);
      stageBackup();
      runExport();
      console.log('增量更新完成。当前统计:');
      console.table(stageStats());
      break;
    }
    case 'backup':
      stageBackup();
      break;
    case 'restore':
      await stageRestore();
      console.table(stageStats());
      break;
    case 'stats': {
      console.table(stageStats());
      break;
    }
    case 'export':
      runExport();
      break;
    case 'exportd1':
      runExportD1(opts);
      break;
    case 'all':
      await stageCatalog(opts);
      await stageMonsters(opts);
      await stageDefenses(opts);
      await stagePages(opts);
      await stageImages(opts);
      stageBackup();
      runExport();
      console.log('全部阶段完成。当前统计:');
      console.table(stageStats());
      break;
    default:
      console.log(HELP);
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
