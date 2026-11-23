# 符文系统执行计划 v2（审计修订版）

> v2 变更：修正 v1 审计发现的 7 处问题（见附录A）；任务粒度细化到步骤级；新增执行纪律与范围冻结清单，防止执行发散。
> 审计基线：2026-11-23 对代码库与数据的实际核验（element-plus 2.7.5 ✓、无测试框架、术语包实有段见 A-1）。

---

## 0. 执行纪律（防发散规则，执行期间逐条遵守）

1. **按任务推进**：只做当前任务列出的步骤；发现"顺手可以做"的事 → 记入本文档"待办池"，不立即做。
2. **每任务三步收尾**：`npm run build` 通过 → 按该任务验收清单逐条手测 → git 提交（单任务单提交，message 用任务号前缀如 `rune-T1.2`）。
3. **数据/依赖冻结**：新增 npm 依赖、新增数据源爬取、修改 Worker 仓库 → 停下向用户确认后再动。
4. **不确定即停下**：SWEX 字段语义、数值表等存疑项，按任务内标注的验证方式确认后才能继续，禁止"先写个大概"。
5. **禁止顺手重构**：不改动 monster/3v3 等既有模块，除非任务明确要求（例外清单：B-1 列出的 3 处最小触碰点）。

## 0.5 范围冻结（明确不做，防蔓延）

| 不做 | 理由 |
|---|---|
| 神器(Artifact)展示与评分 | 二期之后再说；一期仅解析保留字段 |
| 符文图片/图标资源 | 用文字+色块；图标后续从 R2 补 |
| 自动识别魔灵技能做速度调轴 | 二期速度轴 v1 仅手动输入速度值，不做技能推断 |
| 后端导航菜单项 | 菜单由后端下发，一期用图鉴页内入口 |
| 出售建议规则 UI 编辑器 | v1 固定默认规则 + localStorage 覆盖 JSON，不做界面 |
| 社区热门构建 | 二期 T2.4，且仅在用户明确启动后执行 |

---

## 一期：符文评分工作台

### T1.1 依赖与目录骨架（0.5h）
**步骤**
1. `npm i idb`（唯一新依赖，2KB，MIT）
2. 建目录 `src/services/rune/`（空实现占位）、`src/pages/summoner/rune/`
3. 路由注册：`src/router/index.js` 加 `/rune` → `RuneWorkbench.vue`（先放空页面），确认与现有路由无冲突
**验收**：build 通过；dev 打开 `/rune` 显示空页
**禁止**：不动其他路由、不引其他依赖

### T1.2 符文元数据底座（1h）
**输入**：`.swdata/swlens_api/zh_bestiary_texts.json`（术语）、`.swdata/swlens_api/api_public_bestiary_roles.json`（定位）
**步骤**
1. 新建 `.swdata/build_rune_meta.cjs`，产出两个文件到 `public/sw/`：
   - `rune_meta.json`：
     ```
     sets:      23 套装（术语包实际只有 23 条，set_id 9/12 在游戏中不存在）
                { "1": {name:"祝福", pieces:2, effect:"体力 +15%"}, ... }
     stats / statsShort / grades / prefixesFlat / prefixesPct: 术语包直转
     maxRolls: 6★ 与 5★ 两张分母表（见步骤 2）
     slotMain: { "1":["atk_flat"], "3":["def_flat"], "5":["hp_flat"],
                 "2":[...可选...], "4":[...], "6":[...] }   // 槽位主属性合法域
     ```
   - `roles.json`：术语包外的 roles 文件直转（**v1 漏项：此文件在 gitignore 目录，必须导出到 public/sw 才能随包**）
2. `sets.name` 从术语包 `sets` 段取；**`effect`（套装效果文案）术语包没有（A-1），在脚本里手写 23 条常量**（内容为社区公认效果，一次写死）
3. `maxRolls` 数值表（A-2 存疑项）：
   ```
   6★: hp_pct 8 / atk_pct 8 / def_pct 8 / res 8 / acc 8 / cr 6 / cd 7 / spd 6 / hp_flat 375 / atk_flat 40 / def_flat 40
   5★: hp_pct 7 / atk_pct 7 / def_pct 7 / res 7 / acc 7 / cr 5 / cd 6 / spd 5 / hp_flat 300 / atk_flat 32 / def_flat 32
   ```
   验证方式：与两个独立开源实现交叉比对（sw-forge 与 RuneManager 的常量表；两处一致才通过，不一致 → 停，报用户）
4. `slotMain` 的 2/4/6 可选域手写（社区公认，无争议）
**验收**：`node .swdata/build_rune_meta.cjs` 无错；`rune_meta.json` sets=23 条全中文名+效果；`roles.json` 在 public/sw 下；build 通过
**禁止**：不爬新数据；套装效果文案不追求官方措辞（术语包没有），用通行描述

### T1.3 SWEX 解析器 `src/services/rune/swex.js`（1 天）
**接口**：`parseProfile(file: File) → { ok, wizard, monsters[], runes[], artifacts[], warnings[] }`
**步骤**
1. `FileReader` 读文本 → `JSON.parse`（50MB 级，同步可接受，包 try-catch）
2. 格式判定：存在 `wizard_info || unit_list`，否则 `{ok:false, reason}`
3. 归一化 rune（**A-3 已由金样本解除**：`sec_eff = [类型, 基础值, 宝石标志(0/1), 磨砺值]`，value 为磨砺前基础值，评分用 value+grind）：
   ```
   { id: rune_id, setId: set_id, slot: slot_no, stars: class>10?class-10:class, ancient: class>10,
     level: upgrade_curr, main: {stat, value},           // pri_eff=[type,value]
     innate: prefix_eff 有值时 {stat,value},
     subs: sec_eff.map(([type, value, gem, grind]) =>
            ({ stat, value, gem: gem>0, grind: grind>0?grind:0 })) }
   ```
   金样本核验记录(2026-11-23, 酱妳曖-18632815.json, 2024-10 导出)：
   - sec_eff[2] 取值集合恰为 {0,1} → 布尔宝石标志；sec_eff[3]>0 共 45 条 → 磨砺值
   - 样本 {stat:SPD, value:4, grind:2}、{stat:DEF%, value:35, grind:7} 语义自洽
   - stat id 映射实证: 1=体力(平) 2=体力% 3=攻击(平) 4=攻击% 5=防御(平) 6=防御% 8=速度 9=暴击率 10=暴伤 11=抵抗 12=命中
   - 远古符文 class>10 实证 72 条(class=16 即远古6★)
4. 体积裁剪（A-6，按金样本实测校准：4.3MB 原始/1199符文/441魔灵/880神器）：归一化只留所需字段 + `occupied_type/occupied_id` + `rune_lock_list` 集合；artifacts 只留 id/slot；monster 留 `unit_id/unit_master_id/class/level`
5. `warnings[]` 收集所有缺字段/未知 set_id
**验收**：`.swdata/fixtures/swex_mini.json`（T1.9）解析：远古星判定正确、innate/subs 分离正确、warnings 为空；故意删字段的残缺 fixture → ok:false
**禁止**：解析器内不做任何评分计算

### T1.4 IndexedDB 存档 `src/services/rune/store.js`（0.5 天）
**步骤**
1. 用 `idb` 建库 `sw-rune` v1：objectStore `profiles`（keyPath `id`）
2. API：`saveProfile(normalized)` / `listProfiles()`（只列元信息，不含 raw）/ `getProfile(id)` / `deleteProfile(id)` / `setActive(id)` / `getActive()`（active id 存 localStorage `sw_rune_active`）
3. 隐私模式降级：openDB 失败 → 内存 Map + `console.warn` + 页面顶部提示条
4. 单档上限保护：>64MB 拒存并提示
**验收**：导入→刷新页面存档仍在；双存档切换 active 生效；删档正常
**禁止**：不做跨设备同步（那是 T2.3）

### T1.5 评分引擎 `src/services/rune/score.js`（1 天）
**步骤**
1. `efficiency(rune, meta) → { subsEff, totalEff, rolls: [{stat, pct, isMax}] }`：
   ```
   subsEff  = Σ (sub.value + sub.grind) / maxRolls[stars][stat]     // 不含主属性
   totalEff = subsEff + (innate ? innate.value/maxRolls : 0)
   rolls.pct = 每条 sub.value / maxRoll，isMax = pct ≥ 1
   ```
2. `sellAdvice(rune, meta, rules) → 'keep'|'sell'|'consider'`：
   - **硬规则（金样本修正字段名）**：`occupied_id > 0`（金样本实际字段为 occupied_type/occupied_id，无 occupied_by）→ 已装备 keep；`rune_id ∈ rune_lock_list` → 已锁定 keep（金样本发现的新硬规则）
   - 默认规则（常量表）+ localStorage `sw_rune_rules` JSON 覆盖（无 UI，开发者工具改）：
     6★且level≥12且totalEff≥105% → keep；5★及以下 → sell；其余 → consider
3. 纯函数、零副作用；export 出去供 Worker（二期）复用
**验收**：fixture 内置 3 条手算用例（普通/远古带磨砺/带固有），断言输出与手算一致（dev console 跑，无测试框架 A-5，不为此引入 vitest）
**禁止**：不做属性权重/场景分（二期）

### T1.6 工作台页面 `RuneWorkbench.vue`（2 天）
**布局**（Element Plus，照 `ThreeSearch.vue` 骨架）
1. 顶部：存档下拉+导入按钮+删除；统计卡 4 张（总符文/已装备/可出售/套装 top1-5）
2. 筛选栏：套装/槽位/星级(含远古开关)/主属性/效率区间/建议
3. 表格：**`el-table-v2`（element-plus 2.7.5 自带虚拟滚动，A-5 核验过，无需新依赖）**；列=槽位/套装(色点+名)/星+级/主属性/副属性(磨砺绿字)/效率%/建议徽章
4. 行点击 → `el-drawer` 详情：六维条形（每 sub 的 roll pct）+ 所属魔灵 + 单条计分明细
5. 空状态：未导入时的引导卡（SWEX 是什么+去哪下）
**验收**：3000+ 条符文滚动不卡；全部筛选组合可用；i18n 切 EN 正常
**禁止**：不做符文图标、不做导出功能

### T1.7 魔灵构建 tab（1 天）
**步骤**
1. 工作台内 tab"我的魔灵"：列出档案 `monsters`（名=zh_names/zh_forms 映射 `unit_master_id`，图=monsters_min 的 image，v1 漏项 A-7：SWEX 无图片字段，必须走本站 id→image 映射）
2. 选中 → 该魔灵 6 件符文卡 + 汇总属性 + 逐件效率；roles 定位标签 + 建议属性 chips（rune_meta/roles 数据）
3. `MonsterDetail.vue` 详情页加"在工作台查看符文"按钮（仅当存档中存在该 unit_master_id 时显示）——**触碰既有文件 3 处之一（B-1），只加按钮不改其他逻辑**
**验收**：中文名/头像正确；点详情页按钮跳到工作台并选中该魔灵
**禁止**：不做配装推荐（二期）

### T1.8 i18n 与收尾（0.5 天）
1. `zh.js`/`en.js` 加 `rune.*` 段（一次写全 ≈45 key，避免后续零碎补）
2. `MonsterList.vue` 顶部工具区加"符文工作台"入口按钮（触碰点之二）
3. 全页面 zh/en 双语过一遍
**验收**：双语无缺 key（页面无裸 key 显示）

### T1.9 测试 fixture `.swdata/fixtures/swex_mini.json`（与 T1.3 同步做）
- 手工构造：~20 符文覆盖 普通/远古(星>10)/磨砺/宝石/固有/5★与6★/各槽位 + 3 monsters
- **金样本缺口**：真实 SWEX 导出文件（用户提供，游戏内导出）到位前，T1.3 的 sec_eff 语义标记为"待验证"，T1.5 评分对磨砺的计分以金样本复核为准
**验收**：fixture 进 git（小，几十 KB），dev 导入即测

### T1.10 一期上线
- `npm run build` → 提交 `feat(rune-T1): 符文工作台一期` → push release+main → Pages 自动部署
- 线上验收：导入 fixture → 评分/筛选/存档全链路 OK；`/sw/rune_meta.json`、`/sw/roles.json` 200

**一期合计：约 5 个工作日；里程碑 M1=T1.1~T1.5（引擎，可独立验收）→ M2=T1.6~T1.9 → M3=T1.10**

---

## 二期：配装优化器 + 速度调轴 + 云同步

### T2.1 配装求解器 `src/services/rune/optimizer.js` + `worker.js`（2.5 天）
**输入**：`{ monster(含星级/base属性), constraints, inventory(已过滤未装备+keep) }`
**constraints schema（定死，防蔓延）**：
```
{ sets: [setId...](最多2个需求), mainReq: {2:"spd"|..., 4:"hp_pct"|..., 6:"..."},
  targets: {spd?:n, cr?:n, cd?:n, res?:n, acc?:n, hpFloor?:n...}(可选) }
```
**步骤**
1. 候选生成：按槽位（1/3/5 主属性固定由 slotMain 约束；2/4/6 按 mainReq 过滤）→ 效率预排序取 top-50/槽
2. 套装组合枚举：合法套装形态（2+4 / 4 / 2+2+2 / 6），按候选富余度剪枝
3. 组合评分 = 汇总属性对 targets 的加权满足度；输出 top-5
4. 放入 Web Worker：`new Worker(new URL('./worker.js', import.meta.url), {type:'module'})`，进度回调
5. UI：工作台"配装"tab：选魔灵 → 约束面板（套装下拉×2 + 2/4/6 主属性下拉 + 数值目标）→ 结果对比卡
**验收**：fixture 库存求出的构建无套装/槽位/主属性违规（脚本断言）；3000 符文库存 ≤3s 出结果
**禁止**：不做队伍级联优化（6魔灵共享库存），v1 单魔灵

### T2.2 速度调轴面板（1 天）
- **v1 只做：手动输入 5 个速度值 + 双方 → tick 表格输出行动顺序**（ATB 公式参照 SW Toolbox：7.5*tick*speed/100 取整比较）
- **明确不做**（A-8 发散点）：从技能数据自动推断拉条；魔灵技能选择器
**验收**：与 SW Toolbox 同输入结果一致（抽 3 组对照）

### T2.3 云同步（1.5 天，含后端）
**前置已解除（A-9）**：Worker 定位完成 = `E:/program/lnow_site/blog/lnow-site/worker/`（wrangler.json: name=lnow-site-api, route=api.linow.us.kg/*, 绑定 D1(DB/lnow-site) + KV(SITE_CACHE) + R2(ASSETS/static-bdafd), TypeScript src/index.ts, 部署=wrangler deploy, 同仓还有 frontend/migrations/docs）。
**后端（用户仓库内）**
- 路由（在 lnow-site/worker 的 src 内新增 sw 模块，鉴权复用现有中间件）：
  - `POST /sw/runes/profile`：符文档案 JSON 写 R2 `data/sw-runes/{uid}.json`（≤64MB；金样本实测 4.3MB，余量充足）
  - `GET /sw/runes/profile`：读 R2 返回
  - `D1` 可选记一行元数据（uid/存档时间/符文数），便于管理端展示
**前端**
1. `src/services/rune/cloud.js`：上传/拉取（axios 实例自动带 token）
2. 工作台按钮"同步到云端/从云端恢复"（未登录隐藏）；冲突按 savedAt 新者胜+确认弹窗
**验收**：两设备/两浏览器同账号同步成功；未登录不可见入口

### T2.4 社区热门构建（可选，用户明示启动才做）
- 浏览器采集脚本（balance 同套路）→ `public/sw/rune_community.json` → MonsterDetail 新板块

**二期合计：约 5 个工作日；M4=T2.1/2.2 → M5=T2.3 → M6=T2.4(可选)**

---

## 附录A：v1 审计发现与修订（已并入上文）

| # | 问题 | 修订 |
|---|---|---|
| A-1 | 术语包**没有 setEffects 段**（套装效果文案），v1 假设可拼装 | T1.2 手写 23 条效果常量 |
| A-2 | maxRolls 数值凭记忆，未经源校验 | T1.2 双开源实现交叉比对，不一致即停 |
| A-3 | `sec_eff` 第3/4元素语义存疑 | **已解除**：金样本实证 [类型,基础值,宝石0/1,磨砺值]；另发现 equipped 检测字段实为 occupied_id（非 occupied_by）、新增 rune_lock_list 锁定硬规则 |
| A-4 | v1 出售建议未排除已装备符文 | T1.5 加硬规则 occupied_by→keep |
| A-5 | 项目无测试框架、v1 未说明虚拟滚动方案 | 手算用例+dev验收清单；表格定 el-table-v2 |
| A-6 | 原始档案直接入库 50MB 偏大 | T1.3 归一化裁剪至 ≤15MB |
| A-7 | SWEX 无魔灵图片字段，v1 未说明图源 | T1.7 经本站 id→image 映射 |
| A-8 | 速度调轴若做技能推断必然发散 | 范围冻结：v1 仅手动速度输入 |
| A-9 | Worker 改动所属仓库不在本工作区 | **已解除**：定位到 blog/lnow-site/worker（D1+KV+R2 齐备） |

## 附录B：对既有文件的允许触碰点（共3处，之外禁改）

1. `src/router/index.js`：加 1 条路由
2. `src/pages/summoner/monster/MonsterList.vue`：加 1 个入口按钮
3. `src/pages/summoner/monster/MonsterDetail.vue`：加 1 个条件按钮（T1.7）

## 附录C：用户输入项（已全部到位）

1. ✅ 金样本：`F:/zhuomian/user/魔灵/酱妳曖-18632815.json`（2024-10 导出；v1 所需字段全齐且与现行 SWEX 约定一致。注意：2025 后游戏新增"遗物(relic)"该文件没有——v1 范围仅符文，不受影响；未来支持遗物时需新导出）
2. ✅ Worker 仓库：`E:/program/lnow_site/blog/lnow-site/worker/`
