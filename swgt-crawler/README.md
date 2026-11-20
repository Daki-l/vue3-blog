# swgt-crawler

本地爬取 [swgt.io](https://swgt.io)(SWGT: Summoners War Game Tools)公开数据的零依赖 Node.js 爬虫,数据落地 SQLite,可导出 JSON / 导入 Cloudflare D1。

> 数据与图片版权归 Com2Us / swgt.io(Cerusa)所有,仅供个人本地使用。
> robots.txt 对普通抓取为 `Allow: /`;默认礼貌限速(并发 3 + 350ms 间隔)。

## 快速上手

```bash
node src/cli.js all        # 首次全量:目录->魔灵详情->3MDC 防守->页面->图片->备份->导出
node src/cli.js update     # 日常增量更新(推荐)
node src/cli.js stats      # 统计
node src/cli.js help       # 全部命令
```

## 增量更新机制(已有大部分数据后不要全量重爬)

`update` 命令的流程与代价(典型情况):

| 步骤 | 请求数 | 说明 |
|---|---|---|
| catalog 强刷 | 1 | 发现新魔灵 |
| monsters --refresh | 945 | 重抓全部魔灵页(约 6 分钟)。**一举三得**:刷新属性/技能(吃平衡补丁)、发现新防守、拿到每支防守当前的 "N COUNTERS" 提示 |
| defenses | 只抓变化的 | 页面提示的克制数 ≠ 库内 counter_count,或新防守才重抓;通常几十到几百个 |
| pages / images | 少量 | 新链接/新图标才抓 |
| backup + export | 0 | 本地 |

核心信号:魔灵详情页内嵌防守表,每行有 "16 COUNTERS" 链接文本。刷新魔灵页时把它写进
`defense_queue.counter_hint`,与 `defenses.counter_count` 不一致的防守重置为 pending。
克制数不变但内容变(评分/投票波动)的场景不覆盖——那些是低价值漂移,月度可选择性 `defenses --fresh`。

## 备份与恢复(防误删)

本项目目录已被整体误删过两次(2026-11-19,外部工具所致)。防护:

1. **双层备份**(`node src/cli.js backup`,update/all 自动执行):
   - `data/backup/swgt-<时间戳>.db.gz`(保留最近 5 份)
   - `../.swgt-crawler-backup/`(**项目目录外**镜像:最新 DB 快照 + 全部源码)
2. **D1 远程副本**:全量数据在 Cloudflare D1 库 `swgt`(账号级写入额度按 80% 红线把关)
3. 恢复顺序:目录在 → 直接用;目录没了 → 从 `.swgt-crawler-backup/` 恢复源码和 DB;
   镜像也没了 → `git clone`/重建源码后 `node src/cli.js restore` 从 D1 拉回全部数据。
4. `data/raw/`(原始 HTML gzip 缓存)与 `data/images/` 不进备份,可随时重新下载。

## 数据位置

- `data/swgt.db` — SQLite 主库(WAL)
- `data/raw/` — 原始 HTML gzip 缓存(URL 哈希命名,断点续爬/离线重解析)
- `data/images/` — 图片资产(约 7.6k 个,105MB)
- `data/export/` — JSON 快照(monsters/defenses/pages/images)与 D1 导入 SQL(`d1/`)

## 表结构要点

- `monsters`:Com2us ID 主键;`stats/skills/leader_skill/awakening_chain` 为 JSON;
  `last_seen`/`content_hash` 支撑增量
- `defenses`/`counters`/`counter_strategies`:站点自身 ID 主键;`last_seen` 支撑增量
- `defense_queue`:工作队列;`counter_hint` 是增量刷新的变化信号
- `images`:图片清单(dir+file 主键、公开 CDN URL、本地路径、状态)

## D1 同步

```bash
node src/cli.js exportd1                        # 全量(INSERT OR REPLACE,可重复执行)
node src/cli.js exportd1 --since "2026-11-20T00:00:00"  # 增量(只导 last_seen 之后变更的行)
node src/d1api.js --file data/export/d1/01_xxx.sql     # 直连 REST 导入(绕开 wrangler 崩溃)
node src/d1api.js "SELECT COUNT(*) c FROM monsters"    # 随时查远程库
```

免费额度参考:读 500 万行/天、写 10 万行/天(账号级)。全量约 4.8 万行;日常增量几十~几百行。

## 多会话协作注意

同一目录可能有多个 AI 会话/工具同时工作(已发生过目录被外部工具整体删除的事故)。
- 本爬虫的 SQLite 写入有 `busy_timeout=10s`,多进程并发安全
- 图片下载有 existsSync 跳过,重复执行无害
- **建议其他会话只读 `data/export/` 产物,不要在 swgt-crawler 内做清理/删除操作**
- 每次重要操作后跑 `node src/cli.js backup`
