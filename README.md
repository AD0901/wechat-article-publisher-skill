# wechat-article-publisher

> Claude Code 技能：逐字稿 → 公众号草稿箱完整工作流

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**wechat-article-publisher** 是一个面向公众号创作者的 Agent Skill。它能将口语化逐字稿、草稿或选题转化为具有个人风格的公众号文章，自动匹配视觉主题，按 `gpt-image-2 → step-image-edit-2 → HTML` 的顺序生成封面和配图，并发布到公众号草稿箱。

## 预览

只需提供逐字稿或口述内容，AI 就能完成从内容分析到草稿箱发布的全流程：

- 分析内容调性，推荐最佳视觉主题
- 生成文章大纲、配图计划
- 全文撰写，保留你的个人风格
- AI 生图（优先 gpt-image-2，失败后尝试 StepFun step-image-edit-2，再失败降级为 HTML 渲染 + 截图）插入正文
- 一键发布到公众号草稿箱

## 本次更新重点

这版主要固化这些能力与经验：

- **生图链路升级为三层**：封面和正文配图按 `gpt-image-2 → step-image-edit-2 → HTML` 执行；StepFun `step-image-edit-2` 作为 AI 生图的次选模型，最后才进入 HTML/Playwright 或内置封面兜底。
- **富排版组件库**：新增章节标题徽章、分层架构卡片、功能亮点卡片、通用分点卡片、步骤卡片、成熟度分级卡、双栏对比布局、分级判断卡片、信息/警告/建议盒子，后续文章可复用。
- **封面优先走 gpt-image-2**：封面和正文配图先尝试 `gpt-image-2`；封面提示词必须包含 2 个具体“惊艳点”，让画面有明确记忆点。
- **文章深度升级**：文章必须有强争议中心命题、反方观点、判断标准、因果链和现实后果，避免泛泛科普。
- **正式发布规范**：正文开头不重复标题，第一段必须是“本文摘要”；作者字段默认留空；标题和正文不得出现内部主题/风格名称。
- **工程坑点固化**：记录 bash heredoc 写 Python 临时脚本、真实 UTF-8 字符写 emoji、对比度检查、动态获取旧草稿、gpt-image-2 exit 127、Playwright 模块找不到等经验。

实测结果：

- `gpt-image-2` 可生成 900×383 封面并上传到公众号草稿。
- 微信草稿查询已验证：作者可留空、正文以摘要开头、正文无 H1 标题、无内部主题/风格名。
- 当用户明确要求验收 gpt-image-2 封面时，不应使用降级封面创建验收草稿。

## 功能特性

- **逐字稿转文章** — 将口语化内容转化为结构清晰、风格统一的公众号文章
- **6 套视觉主题** — 柔和玉米、物理猫薄荷、彩虹、岩灰、墨韵、电光蓝，按内容自动匹配
- **AI 配图生成** — 优先使用 gpt-image-2 生成正文配图并归一化为 1200×800；不可用或无有效产出时尝试 StepFun step-image-edit-2；仍失败再降级为 HTML 渲染图表 + Playwright 截图 + 微信 CDN 上传
- **强逻辑写作** — 正文以摘要开头，不重复标题；每篇围绕强争议命题、反方观点、判断标准和因果链展开
- **富排版组件库** — 章节标题徽章、架构卡片、亮点卡片、通用分点卡片、步骤卡片、成熟度分级、双栏对比、分级判断卡片和提示盒子
- **个人风格保留** — 基于 9 篇文章分析的个人风格指南，涵盖开头钩子、段落节奏、加粗系统、比喻系统等
- **三确认点工作流** — 主题选择 → 大纲框架 → 完稿，关键节点用户把控，其余全自动
- **微信 DOM 兼容** — 严格遵循微信公众号 CSS 白名单，确保样式正确渲染
- **封面图生成** — 优先使用 gpt-image-2 生成封面并归一化为 900×383；失败时尝试 StepFun step-image-edit-2；仍失败再保留内置主题封面生成
- **草稿箱管理** — 创建新草稿后自动删除旧草稿，安全替换

## 项目结构

```
wechat-article-publisher/
├── SKILL.md                          # Claude Code 技能定义文档
├── references/
│   ├── themes.md                     # 6 套视觉主题的完整色彩定义
│   └── style-guide.md                # 作者个人风格指南（9 篇文章分析）
└── scripts/
    ├── generate_step_image.py         # StepFun step-image-edit-2 次选生图
    └── upload_body_images.py         # 批量上传正文图片到微信 CDN
```

## 预置主题

| 主题 | 风格描述 | 适用场景 |
| :--- | :--- | :--- |
| **Maize** 柔和玉米 | 暖纸色底，玉米金强调 | 个人复盘、踩坑分享 |
| **Mint** 物理猫-薄荷 | 纯白底，薄荷青克制配色 | 技术教程、工具推荐 |
| **Rainbow** 彩虹 | 暖色调多色点缀 | 温暖分享、轻松话题 |
| **Slate** 岩灰 | 极简高级灰，专业克制 | 深度分析、行业判断 |
| **Ink** 墨韵 | 宣纸美学，金褐点缀 | 哲学思考、东方美学 |
| **Electric** 电光蓝 | 纯白底，极致对比 | 前沿趋势、颠覆观点 |

## 前置条件

### 1. 安装 Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. 获取微信公众号开发者凭证

从 [微信公众平台](https://mp.weixin.qq.com/) 获取：

| 参数 | 说明 |
| :--- | :--- |
| **AppID** | 在「设置与开发 → 基本配置」中获取 |
| **AppSecret** | 在「设置与开发 → 基本配置」中生成 |

> ⚠️ **注意**：AppSecret 仅在生成时显示一次，请妥善保存。你需要将公众号 IP 加入白名单才能调用 API。

### 3. 配置微信凭证

```bash
mkdir -p ~/.wechat
echo 'WECHAT_APPID=wxXXXXXXXXXXXXXXXX' >> ~/.wechat/config
echo 'WECHAT_APPSECRET=your_secret' >> ~/.wechat/config
chmod 600 ~/.wechat/config
```

### 4. 安装并登录 Codex CLI（gpt-image-2 必需）

`gpt-image-2` 不是独立的 OpenAI API 客户端，也不使用本仓库提供的密钥。它通过本机 `codex` CLI 复用用户自己的 ChatGPT 登录态。

每个使用者都需要：

1. 安装 Codex CLI。
2. 执行 `codex login`。
3. 登录一个具备图像生成权益的 ChatGPT Plus 或 Pro 账号。

```bash
codex --version
codex login
```

不需要配置 OpenAI API Key；但如果没有有效的 ChatGPT 图像生成权益，`gpt-image-2` 会失败。

### 5. 安装 gpt-image-2（首选生图方式）

封面图和正文配图会优先使用 `gpt-image-2` skill。它依赖本地 Codex CLI 登录态和可用的 ChatGPT 图像生成权益；如果不可用，本 skill 会自动降级到原来的 HTML/Playwright 和内置封面方式。

```bash
npx skills add https://github.com/agentspace-so/agent-skills --skill gpt-image-2 -g -a codex -y
```

安装后可检查脚本是否存在：

```bash
find ~/.claude/skills ~/.codex/skills ~/.agents/skills \
  -path "*/gpt-image-2/scripts/gen.sh" -print
```

### 6. 配置 StepFun Step Plan（次选 AI 生图方式）

`step-image-edit-2` 是本 skill 的 AI 生图次选模型：当 `gpt-image-2` 不可用或无有效产出，且用户没有明确要求只能用 gpt-image-2 验收时，使用 StepFun API 生成封面和正文配图。

需要先订阅 Step Plan 并获取 API Key，然后配置环境变量：

```bash
export STEP_API_KEY="your_stepfun_api_key"
```

每个安装者都要使用自己的 StepFun API Key。本仓库不会、也不应该提供共享 key；不要把 key 写进 GitHub、README、测试文件或文章素材目录。

本 skill 固定使用 Step Plan 专用地址，不使用普通开放平台地址：

```text
https://api.stepfun.com/step_plan/v1
```

可用环境检查确认本机是否已经配置：

```bash
python3 wechat-article-publisher/scripts/generate_step_image.py --check-env
```

如果没有配置 `STEP_API_KEY`，脚本会输出获取 Step Plan、配置环境变量和重新检查的提示，不会发起生图请求，也不会消耗额度。

可用 dry run 检查请求参数：

```bash
python3 wechat-article-publisher/scripts/generate_step_image.py \
  --mode body \
  --prompt "为公众号文章生成一张中文可读的信息图" \
  --dry-run
```

默认参数：`model=step-image-edit-2`、`response_format=b64_json`、`cfg_scale=1.0`、`steps=8`、`text_mode=true`。提示词不要超过 512 个字符。

### 7. 安装 Playwright（最终降级配图方式）

```bash
npx playwright install chromium
```

## 安装技能

将此仓库克隆到 Claude Code 的技能目录：

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/pengcong2020520/generate-wechat-theme-skill.git ~/.claude/skills/wechat-article-publisher
```

需要同时安装依赖技能 `generate-wechat-theme`（用于封面生成和草稿创建）：

```bash
git clone https://github.com/pengcong2020520/generate-wechat-theme-skill.git ~/.claude/skills/generate-wechat-theme
```

## 使用指南

### 基本用法

在 Claude Code 中，直接描述你的需求即可触发技能：

> 帮我把这篇逐字稿写成公众号文章

> 整理一下我的口述内容做成推文

### 工作流程

1. **内容分析 & 主题推荐** — AI 分析逐字稿的话题领域、情绪调性，推荐最佳视觉主题和标题方向 → 🤝 用户确认
2. **大纲框架 & 配图计划** — 生成文章结构大纲、中心争议命题、反方观点、判断标准、因果链、核心比喻、3-5 处配图计划 → 🤝 用户确认
3. **全文撰写** — 正文以摘要开头，不重复标题；按强争议命题和推理链写作，配图位置用占位符标记 → 🤝 用户确认
4. **AI 生图 & 排版发布** — gpt-image-2 生成封面和正文配图；失败时尝试 StepFun step-image-edit-2；仍失败再降级 HTML 渲染图表 → Playwright 截图 → 上传微信 CDN → 替换占位符 → 发布草稿箱（全自动）

### 文章写作硬性规范

- 正文第一段必须是 `本文摘要`，建议 120-180 字，直接说明核心结论、争议点和读者收益。
- 正文开头不写文章标题，不使用 `# H1`。
- 每篇文章必须有一个可争议的中心判断，优先使用“你以为 A，其实 B”的结构。
- 至少一节回应反方观点，说明对方为什么只对了一半。
- 标题、正文、摘要、页脚不得出现内部主题名或风格名，例如“清新科技风”“简约专业风”“Slate”“Mint”。
- 创建草稿时 `author` 字段传空字符串，留给用户在公众号后台自己填写。

### gpt-image-2 封面规范

封面提示词必须包含两个具体惊艳点：

- **惊艳点 1：反常规视觉锚点**，例如“悬浮的操作系统调度中枢”“由任务队列构成的城市天际线”。
- **惊艳点 2：材质/光影/空间记忆点**，例如“半透明玻璃拟物层叠”“微缩沙盘式 3D 纵深”“低饱和霓虹边缘光”。

封面成功标准：

- 最终封面为 900×383。
- 主标题在公众号草稿卡片缩略图里仍可读。
- 两个惊艳点能被看见，但不能压过主标题。
- 不包含二维码、水印、Logo 或密集小字。

如果用户明确说“必须用 gpt-image-2 封面验收”，则 gpt-image-2 未成功时不要创建验收草稿，应报告失败层级并等待重试。

### StepFun 次选生图规范

当 `gpt-image-2` 不可用时，可用 StepFun `step-image-edit-2` 继续生成正文图或封面：

```bash
python3 wechat-article-publisher/scripts/generate_step_image.py \
  --mode body \
  --prompt "正文配图提示词（512 字符内）" \
  --out body-step-raw.png

python3 wechat-article-publisher/scripts/generate_step_image.py \
  --mode cover \
  --prompt "封面提示词（512 字符内）" \
  --out cover-step-raw.png
```

参数约定：

- Base URL：`https://api.stepfun.com/step_plan/v1`
- 环境变量：`STEP_API_KEY`
- 模型：`step-image-edit-2`
- 正文图默认尺寸：`896x1184`，最终归一化为 1200×800
- 封面默认尺寸：`768x1360`，最终归一化为 900×383
- StepFun 的尺寸格式是 `height x width`
- 默认开启 `text_mode=true`，更适合含中文标签的公众号图片

如果用户明确要求“必须用 gpt-image-2 验收”，不要用 StepFun 图片替代验收稿。

### 命令行用法

上传正文图片到微信 CDN：

```bash
python3 scripts/upload_body_images.py image1.png image2.png
```

### 支持的排版元素

| 元素 | 选择器 | 常见定制项 |
| :--- | :--- | :--- |
| 全局样式 | `#wenyan` | 背景、行高、字体颜色 |
| 标题 H1-H6 | `#wenyan h1` ~ `#wenyan h6` | 字号、对齐方式、边框、装饰 |
| 段落 | `#wenyan p` | 字间距、首行缩进、颜色 |
| 引用块 | `#wenyan blockquote` | 左边框、背景色、内边距 |
| 代码块 | `#wenyan pre` / `#wenyan pre code` | 背景色、圆角、字体颜色 |
| 分割线 | `#wenyan hr` | 边框样式、颜色 |
| 超链接 | `#wenyan a` | 颜色、下划线、装饰 |
| 图片 | `#wenyan img` | 最大宽度、对齐方式 |
| 表格 | `#wenyan table` | 边框、间距、对齐 |

### 富排版组件库

后续文章可复用这些微信兼容组件：章节标题徽章、分层架构卡片、功能亮点卡片、通用分点卡片、步骤卡片、成熟度分级卡、双栏对比布局、分级判断卡片、信息/警告/建议盒子。组件必须服务文章推理链，不能为了装饰堆叠；所有组件仍使用内联样式，并遵守微信公众号 CSS 白名单。

通用分点卡片不是用户旅程或趋势的专属格式。只要正文出现 3-6 个并列要点、清单、原则、风险、建议、优先级或分级判断，就可以把普通列表升级为卡片化的分点分级方式，提高审美和可读性。

### 微信渲染与脚本规范

- Python 临时脚本含大量中文、中文引号或 HTML 字符串时，用 bash heredoc：`<< 'ENDOFSCRIPT'`，不要直接用 Write 工具写复杂 Python 字符串。
- WeChat HTML 中 emoji 必须使用真实 UTF-8 字符，例如 `🔵`、`⚡`，禁用 `&#XXXXX;` 这类 HTML 数字实体。
- 生成 HTML 后必须做对比度检查，所有「背景色 + 文字色」组合都要放在当前主题背景上验证，主题切换后重新检查。
- 发布替换草稿时要动态获取旧草稿：先查询草稿列表，再按标题、创建时间或本次运行记录定位要删除的 `media_id`，不要硬编码 `OLD_DRAFT`。
- `gpt-image-2 exit 127` 通常是后台环境 `PATH` 不完整；改为前台同步执行，并显式使用 `/bin/bash /path/to/gen.sh`。
- Playwright 模块找不到时，通常是脚本在临时目录执行导致 Node.js 找不到 `node_modules`；先 `cd /tmp && npm install playwright`，再从 `/tmp` 运行截图脚本。

## 技术说明

所有生成的 CSS 必须在 `#wenyan` 命名空间下运行，这是微信公众号编辑器的 DOM 结构约束。

外部资源（如背景图片）需使用 Data URI 或 HTTPS 链接，不支持本地文件路径和 Web 字体（`@font-face`）。

正文图片使用 `media/uploadimg` 接口上传（非 `material/add_material`），返回微信 CDN URL 后嵌入 HTML。封面图片使用 `material/add_material` 接口上传，得到 `thumb_media_id` 后创建草稿。StepFun 次选生图由 `scripts/generate_step_image.py` 调用 `https://api.stepfun.com/step_plan/v1/images/generations`，并将 `b64_json` 解码为本地图片。正式发布时作者字段留空，标题和正文不得出现内部主题/风格名称。

`publish_multi_theme.py` 会自动把主题名追加到标题，并在 HTML 末尾追加主题页脚。正式发布前必须移除这些内部风格信息，再调用微信草稿 API 创建最终草稿。

### gpt-image-2 账号要求

其他用户使用本 skill 时，需要配置的是自己的 ChatGPT 登录态：

- 需要：`codex login`
- 需要：ChatGPT Plus 或 Pro，且账号具备图像生成权益
- 不需要：OpenAI API Key
- 不支持：直接复用仓库作者的账号或凭证

`gpt-image-2` 调用失败时常见原因：

- 未安装 `codex`
- 未执行 `codex login`
- 登录账号没有图像生成权益
- 网络或模型服务失败
- 脚本没有在 `~/.claude/skills`、`~/.codex/skills`、`~/.agents/skills` 中找到

`gpt-image-2` 不可用时，若已配置 `STEP_API_KEY`，skill 会继续尝试 `step-image-edit-2`。StepFun 也不可用时，才进入 HTML/Playwright 或内置封面降级。

## 错误码速查

| errcode | 含义 | 处理 |
| :--- | :--- | :--- |
| 40164 | IP 不在白名单 | 用 `curl ifconfig.me` 获取出口 IP，去公众号后台添加 |
| 40007 | 缺少 thumb_media_id | 检查封面图是否上传成功 |
| 48001 | API 未授权 | 订阅号不支持 API 发布，手动去草稿箱发布 |
| 40001 | token 过期 | 重新获取 |
| 40125/invalid credential | AppSecret 不正确或已重置 | 重新配置 `~/.wechat/config` |

## 维护复盘

这次维护验证了完整发布链路：

- 从深度文章生成，到封面生成，再到微信草稿创建。
- `gpt-image-2` 封面生成成功后，封面上传到 `material/add_material`，并作为 `thumb_media_id` 绑定草稿。
- 正文配图可用 `gpt-image-2`；若超时或无图产出，可按规则尝试 StepFun `step-image-edit-2`，仍失败再降级到 HTML + Playwright 截图。
- 微信草稿查询接口可用于最终验收：检查标题、作者、封面、正文摘要、H1、内部风格名。

建议验收清单：

- [ ] 草稿箱中能看到新草稿。
- [ ] 封面来自 gpt-image-2，且主标题清晰。
- [ ] 作者为空，方便发布前手动填写。
- [ ] 正文第一屏是“本文摘要”，没有重复文章标题。
- [ ] 正文没有内部主题/风格名称。
- [ ] 文章观点有争议性，且有反方观点和推理链支撑。

## 致谢

本项目深受 [wenyan](https://wenyan.yuzhi.tech/) 启发，CSS 渲染机制部分参考了其在微信公众号排版领域的开创性工作。

## License

MIT © 2025
