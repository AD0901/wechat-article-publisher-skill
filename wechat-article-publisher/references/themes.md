# 极简高级视觉系统 — 微信 CSS 兼容定义

所有颜色值均为纯色 hex，适配微信公众号 CSS 白名单：只用内联 `style`，不用 `<style>`、伪元素、定位、渐变、阴影、`rgba`。圆角和阴影不作为核心审美元素，层次主要靠留白、细线、低饱和色块、编号、边框和排版密度建立。

## 核心原则

每篇文章先确定一套“极简高级基底”，再选择一个“风格胶囊”。不要把主题理解成固定模板换色，而是输出一组可组合的视觉参数：

| 参数 | 说明 |
|------|------|
| 风格胶囊 | 从 6 个胶囊中选择 1 个主方案 + 1 个备选 |
| 背景语法 | 全文底色、局部浅色块、边框线如何组织 |
| 强调色 | 只选 1 个主强调色，必要时 1 个弱辅助色 |
| 组件密度 | 卡片、表格、提示盒和分点块的出现频率 |
| 图像气质 | 封面和正文配图的材质、光线、构图语言 |
| 封面构图 | 标题安全区、主体隐喻、留白方向 |

极简高级感的稳定特征：
- 大留白优先，正文不要被连续色块填满。
- 低饱和优先，强调色只用于标题锚点、编号、边线、重点词。
- 细线优先，用 `1px solid` 边框和 `border-left` 建立秩序。
- 少即是多，每屏最多出现 1 个强视觉组件。
- 主题名称只作为内部参数，正式标题、摘要、正文和页脚不得出现。

## 风格胶囊速查

| 胶囊 | 底色 | 主强调色 | 气质 | 适用场景 |
|------|------|----------|------|----------|
| **Gallery White** 画廊白 | `#fbfbf8` | `#1f1f1f` | 策展、冷静、留白 | 深度观点、产品判断、轻叙事 |
| **Mist Report** 雾灰报告 | `#f4f6f5` | `#4f6f73` | 咨询报告、秩序、克制 | 行业分析、管理方法、复杂论证 |
| **Warm Paper** 暖白纸本 | `#fbf7ef` | `#8a6a48` | 纸张、温度、低调金褐 | 个人复盘、人文思考、经验总结 |
| **Mono Margin** 黑白边注 | `#ffffff` | `#111111` | 近单色、边注、编辑感 | 犀利观点、原则清单、判断框架 |
| **Quiet Tech** 静奢科技 | `#f7f9fb` | `#2f6f8f` | 冷白、银灰、少量科技色 | AI 工具、技术教程、系统架构 |
| **Dark Editorial** 深色特刊 | `#111315` | `#b8a36a` | 暗底、杂志、强反差 | 范式转移、趋势预判、重磅观点 |

---

## 1. Gallery White · 画廊白

适合把文章做成“策展墙”：大量白边、少量黑线、偶尔一个低饱和色块。

| 元素 | CSS / 规则 |
|------|------------|
| 全文底色 | `background-color:#fbfbf8` |
| 内容面 | `background-color:#fffffc` |
| 正文文字 | `color:#1f1f1f` |
| 弱文字 | `color:#6f6f68` |
| 主强调 | `#1f1f1f` |
| 辅助强调 | `#9a8f7a` |
| 细线 | `border:1px solid #e4e1d8` |
| H2 | `color:#1f1f1f;border-left:3px solid #1f1f1f;padding-left:12px` |
| strong | `color:#111111;font-weight:700;border-bottom:1px solid #9a8f7a` |
| 引用块 | `background-color:#f4f2ea;border-left:3px solid #1f1f1f;color:#3d3d38` |
| 表格 th | `background-color:#f0eee7;color:#1f1f1f;border-bottom:1px solid #d8d3c8` |
| 组件密度 | 中低，优先章节徽章、双栏对比、通用分点卡片 |
| 图像气质 | 画廊展签、纸面印刷、冷白自然光、主体居中 |
| 封面构图 | 标题靠左或居中，主体隐喻像展品一样留足空白 |

## 2. Mist Report · 雾灰报告

适合复杂分析。画面像一份精修过的咨询报告，不靠装饰靠信息秩序。

| 元素 | CSS / 规则 |
|------|------------|
| 全文底色 | `background-color:#f4f6f5` |
| 内容面 | `background-color:#ffffff` |
| 正文文字 | `color:#25313a` |
| 弱文字 | `color:#68737d` |
| 主强调 | `#4f6f73` |
| 辅助强调 | `#8a969b` |
| 细线 | `border:1px solid #dbe1df` |
| H2 | `color:#25313a;border-left:4px solid #4f6f73;padding-left:12px` |
| strong | `color:#25313a;font-weight:700;border-bottom:2px solid #aab6b5` |
| 引用块 | `background-color:#edf1f0;border-left:3px solid #4f6f73;color:#46525a` |
| 表格 th | `background-color:#e7ecea;color:#25313a;border-bottom:1px solid #cbd5d2` |
| 组件密度 | 中高，优先架构卡片、成熟度分级卡、表格、判断卡片 |
| 图像气质 | 咨询报告图、灰绿线框、仪表盘、流程图清晰 |
| 封面构图 | 标题放中央安全区，主体是结构化图谱或系统面板 |

## 3. Warm Paper · 暖白纸本

适合保留人味，但不走“可爱暖色”。像一本克制的纸质随笔集。

| 元素 | CSS / 规则 |
|------|------------|
| 全文底色 | `background-color:#fbf7ef` |
| 内容面 | `background-color:#fffdf8` |
| 正文文字 | `color:#2f2923` |
| 弱文字 | `color:#766b60` |
| 主强调 | `#8a6a48` |
| 辅助强调 | `#c8b89c` |
| 细线 | `border:1px solid #e5dac8` |
| H2 | `color:#2f2923;border-left:4px solid #8a6a48;padding-left:12px` |
| strong | `color:#5f452c;font-weight:700;border-bottom:2px solid #d9c6a8` |
| 引用块 | `background-color:#f5efe4;border-left:3px solid #8a6a48;color:#574b3f` |
| 表格 th | `background-color:#efe6d7;color:#2f2923;border-bottom:1px solid #d8c8ae` |
| 组件密度 | 中等，优先通用分点卡片、信息盒子、步骤卡片 |
| 图像气质 | 纸张纹理、手稿边注、暖白桌面、少量金褐线条 |
| 封面构图 | 标题像书封标题，主体隐喻低饱和、靠近纸本质感 |

## 4. Mono Margin · 黑白边注

适合强判断、强原则的文章。视觉上接近杂志边注和编辑批注。

| 元素 | CSS / 规则 |
|------|------------|
| 全文底色 | `background-color:#ffffff` |
| 内容面 | `background-color:#ffffff` |
| 正文文字 | `color:#111111` |
| 弱文字 | `color:#666666` |
| 主强调 | `#111111` |
| 辅助强调 | `#b7b7b7` |
| 细线 | `border:1px solid #d9d9d9` |
| H2 | `color:#111111;border-left:5px solid #111111;padding-left:12px` |
| strong | `color:#111111;font-weight:800;border-bottom:2px solid #111111` |
| 引用块 | `background-color:#f5f5f5;border-left:3px solid #111111;color:#333333` |
| 表格 th | `background-color:#eeeeee;color:#111111;border-bottom:1px solid #cfcfcf` |
| 组件密度 | 中低，优先编号块、双栏对比、分级判断卡片 |
| 图像气质 | 黑白编辑版、强留白、线框结构、清晰编号 |
| 封面构图 | 大标题 + 一个黑色几何/结构隐喻，避免彩色装饰 |

## 5. Quiet Tech · 静奢科技

适合技术内容，但不要做成“蓝色科技模板”。只用少量冷色制造精密感。

| 元素 | CSS / 规则 |
|------|------------|
| 全文底色 | `background-color:#f7f9fb` |
| 内容面 | `background-color:#ffffff` |
| 正文文字 | `color:#152033` |
| 弱文字 | `color:#647181` |
| 主强调 | `#2f6f8f` |
| 辅助强调 | `#aeb8c2` |
| 细线 | `border:1px solid #dfe6ec` |
| H2 | `color:#152033;border-left:4px solid #2f6f8f;padding-left:12px` |
| strong | `color:#1f536b;font-weight:700;border-bottom:2px solid #b8c9d2` |
| 引用块 | `background-color:#eef4f6;border-left:3px solid #2f6f8f;color:#334453` |
| 表格 th | `background-color:#e9eff3;color:#152033;border-bottom:1px solid #ccd7df` |
| 组件密度 | 中高，优先架构卡片、步骤卡片、功能亮点卡片 |
| 图像气质 | 冷白空间、半透明线框、产品系统图、少量蓝灰光 |
| 封面构图 | 标题中央安全区，主体像精密仪器或操作系统界面 |

## 6. Dark Editorial · 深色特刊

适合少数重磅文章。暗色不是默认选项，只有当文章有强冲突、强预判、强转折时使用。

| 元素 | CSS / 规则 |
|------|------------|
| 全文底色 | `background-color:#111315` |
| 内容面 | `background-color:#171a1d` |
| 正文文字 | `color:#f4f1ea` |
| 弱文字 | `color:#b9b6ad` |
| 主强调 | `#b8a36a` |
| 辅助强调 | `#6f7f8f` |
| 细线 | `border:1px solid #2b3034` |
| H2 | `color:#f4f1ea;border-left:4px solid #b8a36a;padding-left:12px` |
| strong | `color:#f4f1ea;font-weight:800;border-bottom:2px solid #b8a36a` |
| 引用块 | `background-color:#1e2226;border-left:3px solid #b8a36a;color:#ddd6c8` |
| 表格 th | `background-color:#20252a;color:#f4f1ea;border-bottom:1px solid #3a4148` |
| 组件密度 | 低，避免满屏暗色卡片，优先大段留白和少量判断卡 |
| 图像气质 | 暗色编辑封面、低亮金色边线、聚光灯、深空间 |
| 封面构图 | 主体和标题必须位于中央安全区，暗底上留足对比 |

---

## 轻量反重复检查

每次推荐视觉方案前，做一次 30 秒审美去重。无需维护复杂数据库，只要检查本次对话、最近一次发布记录或用户明确提到的上一版即可。

如果命中以下任一情况，优先启用备选胶囊或调整背景语法：
- 连续两篇都是纯白/近白底 + 蓝/青强调。
- 连续两篇都使用同一胶囊，且文章类型不是系列文。
- 封面连续使用“中心标题 + 抽象几何块”的构图。
- 正文连续使用同一组组件：章节徽章 + 通用卡片 + 提示盒。
- 当前内容明明是经验复盘/人文思考，却继续套用技术冷色。

去重方式：
1. 先换胶囊，不强行换文章气质。例如 `Quiet Tech` 连续出现时，技术文章可切到 `Mist Report`。
2. 如果必须保留胶囊，就换背景语法：从纯白切到雾灰、从浅底切到黑白边注、从满卡片切到细线分隔。
3. 封面构图至少换一个维度：标题位置、主体隐喻、留白方向、材质光线。
4. 对系列文可以保持同一胶囊，但必须变更章节组件节奏和封面主体。

## 匹配决策树

```
文章分析结果
│
├── 技术术语密集 + 步骤/架构多
│   ├── 偏实操教程 → Quiet Tech 静奢科技
│   └── 偏行业判断 → Mist Report 雾灰报告
│
├── 论证链长 + 情绪冷静 + 第一人称少
│   ├── 商业/组织/趋势 → Mist Report 雾灰报告
│   └── 原则/方法/判断 → Mono Margin 黑白边注
│
├── 第一人称高 + 经验复盘/踩坑
│   ├── 温和反思 → Warm Paper 暖白纸本
│   └── 锐利复盘 → Mono Margin 黑白边注
│
├── 人文/哲学/长期主义
│   ├── 温度更高 → Warm Paper 暖白纸本
│   └── 判断更冷 → Gallery White 画廊白
│
└── 范式转移/重磅预判/强冲突
    ├── 默认 → Gallery White 画廊白
    └── 需要强戏剧性 → Dark Editorial 深色特刊
```

## 匹配度计算逻辑

每个胶囊对文章特征打分（0-100），加权平均后排序：

1. 话题领域匹配（25%）
2. 情绪调性匹配（20%）
3. 论证密度匹配（20%）
4. 角色定位匹配（15%）
5. 组件需求匹配（10%）
6. 轻量反重复修正（10%）

推荐 Top 1 为「推荐视觉方案」，Top 2 为「备选」。如果反重复修正让 Top 2 更合适，可以推荐 Top 2，但要在确认点里说明“为避免与上一版过于相似，建议使用备选方案”。

## 旧主题兼容映射

旧版 6 套主题不再作为主推荐系统，只作为历史内容或用户手动指定时的兼容别名：

| 旧主题 | 新胶囊 |
|--------|--------|
| Maize 柔和玉米 | Warm Paper 暖白纸本 |
| Mint 物理猫-薄荷 | Quiet Tech 静奢科技 |
| Rainbow 彩虹 | Gallery White 画廊白，必要时提高暖色辅助色 |
| Slate 岩灰 | Mist Report 雾灰报告 |
| Ink 墨韵 | Warm Paper 暖白纸本或 Mono Margin 黑白边注 |
| Electric 电光蓝 | Quiet Tech 静奢科技，降低蓝色饱和度 |
