# 前端中英文(Content i18n)规范

> 本规范约束 game.linow.us.kg 前端(vue3-blog 仓库)的**所有新页面/新组件**。
> 由 3v3 页面线上问题(中文模式显示英文名)复盘确立,2026-11-20 起生效。

## 一、总原则

| 内容类型 | 处理方式 | 示例 |
|---|---|---|
| **固定 UI 文案**(按钮/标签/提示/标题) | 走 `t('key')`,`locales/zh.js` + `en.js` 成对新增 | `t('pvp.search')` |
| **用户产生内容**(评论/留言/回复) | **原样存储、原样展示,禁止翻译** | 评什么显示什么 |
| **第三方数据内容**(swgt 攻略/魔灵英文名) | 展示层做 **zh 覆盖**,英文回退 | `pick(zh, en)` |
| **后端下发导航名**(中文) | 走 `navName()`,新导航项同步补 `NAV_EN` 映射 | i18n.js 的 `NAV_EN` |

## 二、魔灵名称的 zh 覆盖(重点,易错)

数据源 `monsters_min.json` 只有英文名。中文名来自 `fetchZhNames()`(`zh_names.json`,key=魔灵 id)。

**规则 1:覆盖时必须保留英文原名**

```js
// 正确(3v3 页面事故后的标准写法)
if (zh && isZh()) {
  for (const m of list) {
    const z = zh[m.id];
    if (z?.n) {
      m.name_en = m.name; // ← 必须保留!数据联接/英文名反查都靠它
      m.name = z.n;
    }
  }
}
```

**规则 2:任何"用名字反查/联接"必须用 `name_en`,用 id 优先**

静态数据(防守 key、攻略署名等)里是英文名——用覆盖后的中文名去匹配会全部落空。
能用 id 的场景一律用 id(防守 key 就是三 ID 拼接,`key.split('-')` 后按 id 查列表)。

**规则 3:英文模式下不叠加覆盖层**,直接展示英文名(i18n 切换是整页 reload,数据层随语言重取)。

## 三、新增页面 Checklist

- [ ] 所有固定文案走 `t()`,zh/en 两个文件**成对**补 key(缺 en 会回退 zh,可接受但不算完成)
- [ ] 涉及魔灵/技能名称:引入 `fetchZhNames()` + 保留 `name_en` + `pick(zh, en)` 展示
- [ ] 后端数据字段(描述/攻略类)**不翻译**,原样渲染
- [ ] 新导航项:补 `i18n.js` 的 `NAV_EN` 映射
- [ ] 模板里用到的工具函数(`pick`/`monsterImg`/`t`…)**逐个核对 import**(3v3 首版漏 import pick 导致线上报错)
- [ ] `<script setup>` 内 import 必须在标签**内部**(LayoutFooter 事故:import 写在 template 外被编译器静默丢弃)

## 四、历史事故存档(引以为戒)

1. `LayoutFooter.vue`(commit 6d27a49):import 写在 `<template>` 外 → `t` undefined → 全站空白页
2. `ThreeSearch.vue`(首版):模板用 `pick` 未导入;热门榜用**覆盖后的中文名**反查英文名 → 中文模式显示英文
