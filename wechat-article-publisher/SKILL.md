---
name: wechat-article-publisher
description: 将用户的语音逐字稿、口语草稿转化为带有个人风格的微信公众号文章，自动匹配视觉主题，支持 HTML 配图（HTML 生图 + 截图插入正文），并发布到公众号草稿箱。当用户说「把我说的这些写成公众号文章」「这篇逐字稿帮我发公众号」「整理一下我的口述内容做成推文」「帮我把这个草稿润色后发公众号」时必须使用。也适用于用户提到 逐字稿、语音转文字、口语整理、公众号发布、推文、WeChat article、speech transcript to article 等场景。即使文件是纯文本 .md 格式，只要用户表达的是「从口语内容出发创作公众号文章」的意图，就应该触发。
---

# 逐字稿 → 公众号草稿箱 完整工作流

把口语化逐字稿变成一篇图文并茂的公众号文章，自动匹配视觉主题，AI 生成配图，发布到草稿箱。

## 核心原则

- **三个确认点**：主题选择 → 大纲框架 → 完稿。其余全自动。
- **保留口语节奏**：不把逐字稿变成论文。保留「洞察者 + 实践者」双声部。
- **先创后删**：创建新草稿成功后再删旧草稿，避免数据丢失。
- **`ensure_ascii=False`**：所有 WeChat API 调用的 JSON 必须用 `ensure_ascii=False` + `.encode('utf-8')`，否则中文转义导致字段超长。

---

## 一、完整流程（4 阶段 + 3 确认点）

### 阶段 1：内容理解 & 主题推荐

**输入**：用户提供逐字稿（可以是纯文本、文件路径、或者直接在对话中口述）。

**分析维度**：

| 维度 | 判断内容 |
|------|---------|
| 话题领域 | AI 技术 / 产品思维 / 行业趋势 / 个人经验 / 实操教程 |
| 情绪调性 | 锐利反直觉 / 冷静分析 / 幽默吐槽 / 哲学深思 |
| 建议角色 | 趋势分析师 / 踩坑分享者 / 认知科学家 / 老板管理者 |
| 第一人称密度 | 高（个人叙事）→ 故事型 / 低（客观分析）→ 洞察型 |

**输出**：
- 推荐视觉主题（6 选 1 + 备选）
- 2-3 个标题方向
- 建议文章角色

**🤝 确认点 1**：询问用户确认主题和标题方向。格式如下：

```
📊 内容分析
- 话题领域：XXX
- 情绪调性：XXX
- 建议角色：XXX

🎨 推荐主题：XXX (匹配度 XX%)
  备选：XXX

📝 建议标题：
  1. XXX
  2. XXX
  3. XXX

请选择或提出修改方向。
```

主题配色定义见 `references/themes.md`。

---

### 阶段 2：大纲框架 & 配图计划

**基于确认的主题和标题方向，生成**：

1. **文章结构大纲**：章节标题 + 每节核心论点（标题必须是论点，不是标签）
2. **开头钩子策略**：5 种钩子选 1（痛点场景 / 大胆断言 / 个人经历 / 对话提问 / 宏大叙事）
3. **结尾收束策略**：5 种收束选 1（对比收束 / 定义收束 / 权力赋予 / 社交邀请 / 诗化升维）
4. **核心比喻/意象建议**：1-2 个贯穿全文的隐喻
5. **配图计划**：3-5 处配图位置 + 类型 + 内容描述

**配图计划格式**：

```
📷 配图计划（共 N 处）

[图1] 位置：第X章末尾 | 类型：arch/compare/flow/concept
      内容：[描述图表要表达的核心信息和结构]
[图2] ...
```

**🤝 确认点 2**：用户确认大纲 + 配图计划。

---

### 阶段 3：全文撰写（含占位符）

**写作约束**（详细风格指南见 `references/style-guide.md`）：

- **段落节奏**：短段（1-2 句）→ 中段（3-4 句展开）→ 短段加粗钉死结论 → 空行呼吸 → 下一轮
- **加粗系统**：只加粗四类内容——认知翻转句、核心定义句、行为指引句、结构锚点句。加粗串联可成脱水版
- **口语降维**：抽象概念后必须跟日常类比或口语锚点
- **标题即论点**：章节标题用「数字 + 完整判断句」，不用中性标签
- **开头 3 秒张力**：前 3 句话出现加粗句，制造认知冲突或情绪共鸣
- **结尾干净**：不加客套，用对比/定义/诗化/权力赋予收束

**占位符格式**（配图位置用）：

```
[IMG:arch]
标题：XXX
描述：XXX
[/IMG]
```

四种类型：`arch`（架构图）、`compare`（对比图）、`flow`（流程图）、`concept`（概念图）。

**🤝 确认点 3**：展示完整文章，用户可提出修改意见。

---

### 阶段 3.5：HTML 生图 + 截图（全自动）

用户确认完稿后，对每个 `[IMG:type]` 占位符执行生图：

**步骤 1：编写 HTML**

根据占位符的类型和描述，编写独立的 HTML 文件来渲染图表。要求：
- 尺寸 1200×800，字体用系统自带中文字体（PingFang SC, Hiragino Sans GB, Microsoft YaHei）
- 匹配选定主题的配色体系（深色主题用暗背景，浅色主题用亮背景）
- 可以有渐变、阴影、圆角（输出是图片，不受微信 CSS 限制）
- 信息层级清晰：标题 → 主体内容 → 底部结论

**步骤 2：截图**

```bash
npx playwright screenshot "file://绝对路径.html" 输出.png --wait-for-timeout 2000
```

注意：用 `npx playwright` CLI（Node.js 版），不用 Python playwright（可能未安装）。

**步骤 3：上传到微信 CDN**

用 `scripts/upload_body_images.py` 或直接调 API：

```python
POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=TOKEN
Content-Type: multipart/form-data; boundary=...
```

返回 `{"url": "http://mmbiz.qpic.cn/..."}`  → 这是正文图片 URL。

**步骤 4：后处理 HTML 替换占位符**

在生成的微信 HTML 中，`[IMG:type]...[/IMG]` 块会被转换成多个 `<p>` 标签。需要用正则跨标签匹配并替换为：

```html
<p style="text-align:center;margin:1.5em 0;">
  <img src="微信CDNURL" style="max-width:100%;display:block;margin:0 auto;" />
</p>
```

---

### 阶段 4：排版 + 封面 + 发布（全自动）

调用 `@generate-wechat-theme` 的 publish 脚本发布：
```bash
python3 ~/.claude/skills/generate-wechat-theme/scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "标题" \
  --author "作者名" \
  --digest "摘要" \
  --themes <匹配的主题名>
```

**如果文章含图片**，需要：
1. 先用 publish 脚本生成不带图的草稿
2. 后处理 HTML 替换占位符为 `<img>` 标签
3. **重新创建新草稿**（手动调 API，注意 `ensure_ascii=False`）
4. 新草稿成功后删除旧草稿

**字段限制速查**（`ensure_ascii=True` 时极易触发）：

| 字段 | 限制 |
|------|------|
| title | 64 字符（含主题后缀预留 10 字符） |
| author | 8 字符 |
| digest | 120 字符 |
| 正文图片 | 用 `media/uploadimg`，非 `material/add_material` |
| 封面图片 | 用 `material/add_material`，非 `media/uploadimg` |

---

## 二、主题自动匹配

根据内容分析结果自动推荐主题。匹配逻辑如下：

| 文章特征 | 首选主题 | 次选主题 |
|---------|---------|---------|
| 抽象概念多、论证链长、情绪冷静、第一人称少 | **Slate** 岩灰 | Ink 墨韵 |
| 技术术语密集、代码/表格/步骤多 | **Mint** 物理猫-薄荷 | Electric 电光蓝 |
| 第一人称高频、故事线索明显、情绪词多 | **Maize** 柔和玉米 | Rainbow 彩虹 |
| 断言密度高、反问句多、态度鲜明 | **Electric** 电光蓝 | Ink 墨韵 |
| 东方美学、哲学思考、人文关怀 | **Ink** 墨韵 | Slate 岩灰 |
| 温暖分享、生活感悟、轻松话题 | **Rainbow** 彩虹 | Maize 玉米 |

**交互时显示匹配度百分比**，让用户可以选择推荐主题或手动指定。

---

## 三、常见问题速查

| 问题 | 原因 | 解决 |
|------|------|------|
| 标题/作者/摘要 长度超限 | `json.dumps` 默认 `ensure_ascii=True`，中文转 `\uXXXX` 膨胀 3-6 倍 | 必须 `ensure_ascii=False` + `.encode('utf-8')` |
| `[IMG]` 占位符原样显示 | markdown→HTML 转换器把占位符当文本 | 在 HTML 生成后做后处理替换 |
| Playwright 截图空白 | webfont/CSS 未加载完 | `--wait-for-timeout 2000` |
| 正文图片不显示 | 用了 `material/add_material` 而非 `media/uploadimg` | 正文图用 `media/uploadimg` |
| `npx playwright` 未找到 | Chromium 浏览器未安装 | `npx playwright install chromium`（一次性） |

---

## 四、资源文件

- `references/style-guide.md` — 作者个人风格完整指南（9 篇文章分析结果）
- `references/themes.md` — 6 套视觉主题的完整色彩定义（微信 CSS 兼容版）
- `scripts/upload_body_images.py` — 批量上传正文图片到微信 CDN
- `@generate-wechat-theme` — 已有的排版/封面/发布 skill，封面生成和基础草稿创建调用它
