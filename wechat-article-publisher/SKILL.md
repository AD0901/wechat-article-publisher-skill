---
name: wechat-article-publisher
description: 将用户的语音逐字稿、口语草稿转化为带有个人风格的微信公众号文章，自动匹配视觉主题，优先用 gpt-image-2 生成封面和正文配图，失败时尝试 StepFun step-image-edit-2，仍失败再降级为现有 HTML 配图（HTML 生图 + 截图插入正文）和基础封面生成，并发布到公众号草稿箱。当用户说「把我说的这些写成公众号文章」「这篇逐字稿帮我发公众号」「整理一下我的口述内容做成推文」「帮我把这个草稿润色后发公众号」时必须使用。也适用于用户提到 逐字稿、语音转文字、口语整理、公众号发布、推文、WeChat article、speech transcript to article 等场景。即使文件是纯文本 .md 格式，只要用户表达的是「从口语内容出发创作公众号文章」的意图，就应该触发。
---

# 逐字稿 → 公众号草稿箱 完整工作流

把口语化逐字稿变成一篇图文并茂的公众号文章，自动匹配视觉主题，按 `gpt-image-2 → step-image-edit-2 → HTML` 的顺序生成封面和正文配图，必要时降级到现有 HTML/截图和基础封面生成方式，发布到草稿箱。

## 核心原则

- **三个确认点**：主题选择 → 大纲框架 → 完稿。其余全自动。
- **保留口语节奏**：不把逐字稿变成论文。保留「洞察者 + 实践者」双声部。
- **深度优先**：每篇文章必须有一个强争议中心命题，并用因果链、反方观点、判准和现实后果支撑，不能只做概念介绍或泛泛科普。
- **正文不放标题**：公众号正文开头不要出现文章标题或 H1；第一屏必须直接进入“本文摘要”，降低读者理解成本。
- **正式感优先**：标题、正文、页脚、摘要里不得出现「清新科技风」「极简科技风」「简约专业风」「Slate」「Mint」等主题/风格名称；这些只允许作为内部视觉参数。
- **作者留空**：创建草稿时 `author` 字段传空字符串，留给用户自己填写。
- **先创后删**：创建新草稿成功后再删旧草稿，避免数据丢失。
- **AI 生图链路**：封面和正文配图按 `gpt-image-2 → step-image-edit-2 → HTML` 执行。先尝试 `@gpt-image-2`；失败后若 `STEP_API_KEY` 可用，尝试 StepFun `step-image-edit-2`；仍失败才降级到 HTML/Playwright 或 `@generate-wechat-theme` 的基础封面。
- **首次使用要引导配置 StepFun**：如果需要进入 StepFun 次选路径但 `STEP_API_KEY` 未配置，先告诉用户需要用自己的 StepFun API Key，并给出 `export STEP_API_KEY="..."` 和 `scripts/generate_step_image.py --check-env` 检查命令；不要要求或暗示可以复用仓库作者的 key。
- **富排版组件优先**：文章排版不要只做段落和标题；根据内容使用章节标题徽章、架构卡片、亮点卡片、旅程步骤、成熟度分级、双栏对比、趋势卡片和提示盒子增强层次。
- **显式验收不降级**：如果用户明确要求“必须用 gpt-image-2 封面验收”或“gpt-image-2 能用就必须生成”，封面没有成功产出时不要创建验收草稿；必须报告失败层级并重试或等待用户决定。
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
6. **争议命题与推理链**：必须单独列出中心争议命题、反方观点、判断标准、因果链和现实后果

**配图计划格式**：

```
📷 配图计划（共 N 处）

[图1] 位置：第X章末尾 | 类型：arch/compare/flow/concept
      内容：[描述图表要表达的核心信息和结构]
[图2] ...
```

**深度框架格式**：

```
🧠 中心争议命题：不是「XXX 很重要」，而是「很多人以为 A，其实真正决定结果的是 B」
🪞 反方观点：读者可能不同意的点是什么
⚖️ 判断标准：用什么标准证明本文观点，而不是靠情绪判断
🔗 因果链：A → B → C → 结果，每一环必须能解释为什么
⚠️ 现实后果：如果读者继续按旧理解做，会付出什么代价
```

**🤝 确认点 2**：用户确认大纲 + 配图计划。

---

### 阶段 3：全文撰写（含占位符）

**写作约束**（详细风格指南见 `references/style-guide.md`）：

- **正文第一段必须是本文摘要**：用 `> 本文摘要：...` 开头，120-180 字，直接说明核心结论、争议点和读者能获得什么。摘要不是背景介绍，不要写成客套导语。
- **正文开头不要标题**：不要在正文第一行写 `# 标题`，也不要重复文章标题；正式发布的标题只进入微信草稿的 `title` 字段。
- **强争议命题**：全文必须围绕一个能引发判断冲突的中心观点展开，优先使用「你以为 A，其实 B」结构，避免“某某很重要”这种低密度判断。
- **强逻辑链**：每个章节至少承担一个推理功能：提出判断、解释机制、回应反方、给出判准、落到行动。不要写成并列知识点堆砌。
- **反方必须出场**：至少有一节明确写出读者可能反驳的观点，并解释它为什么只对了一半。
- **结论要有代价感**：不能只说“应该重视”，必须说明继续沿用旧理解会造成什么具体损失。
- **段落节奏**：短段（1-2 句）→ 中段（3-4 句展开）→ 短段加粗钉死结论 → 空行呼吸 → 下一轮
- **加粗系统**：只加粗四类内容——认知翻转句、核心定义句、行为指引句、结构锚点句。加粗串联可成脱水版
- **口语降维**：抽象概念后必须跟日常类比或口语锚点
- **标题即论点**：章节标题用「数字 + 完整判断句」，不用中性标签
- **开头 3 秒张力**：摘要后的前 3 句话出现加粗句，制造认知冲突或情绪共鸣
- **结尾干净**：不加客套，用对比/定义/诗化/权力赋予收束
- **禁用主题/风格字眼**：正文、标题、摘要、页脚中不得出现「清新科技风」「极简科技风」「简约专业风」「暖色人文风」「手绘笔记风」「赛博朋克霓虹风」「Slate」「Mint」「Rainbow」「Maize」「Electric」「Ink」等内部视觉主题名称。

**占位符格式**（配图位置用）：

```
[IMG:arch]
标题：XXX
描述：XXX
[/IMG]
```

四种类型：`arch`（架构图）、`compare`（对比图）、`flow`（流程图）、`concept`（概念图）。

#### 富排版组件库（本 skill 内置）

生成微信 HTML 时，优先复用下面的组件。所有组件仍必须遵守微信 CSS 白名单：只用内联 `style`，不用 `<style>`、伪元素、定位、渐变、阴影、圆角、rgba。

| 组件 | 适用内容 | 微信兼容写法 |
|------|----------|--------------|
| 章节标题徽章 | 章节开头、关键判断 | `p` 小徽章 + `h2` 论点标题 + `border-left` |
| 分层架构卡片 | 系统结构、能力分层、模型链路 | 多个 `section`/`p` 堆叠，靠 `border`、纯色背景、缩进区分层级 |
| 功能亮点卡片 | 产品能力、方法优势 | 单个 `section` 包含图标、短标题、1-2 句说明 |
| 通用分点卡片 | 任意 3-6 个并列要点、方法原则、注意事项、能力清单 | 每个分点一个块：短标题 + 1-3 行说明，可用真实 UTF-8 图标或编号 |
| 步骤卡片 | 使用流程、迁移路径、操作步骤、决策顺序 | 显式编号 `01/02/03`，每步一个块，不用 `ol/li` |
| 成熟度分级卡 | L1-L5、阶段划分、能力等级 | 等级标签 + 判断标准 + 典型表现 |
| 双栏对比布局 | 旧方式/新方式、误区/正解 | 用 100% 宽表格或连续块模拟双栏，移动端优先可读 |
| 分级判断卡片 | 趋势、风险、机会、优先级、判断维度 | 卡片标题写成判断句，下面放信号、影响、行动建议 |
| 信息/警告/建议盒子 | 补充说明、风险、实践建议 | 纯色背景 + `border-left`；标题直接写真实 UTF-8 图标 |

组件使用规则：
- 每篇长文至少使用 2-3 类组件，但不要为了丰富而堆组件；组件必须服务推理链。
- 组件标题仍然写成判断句，不写“模块一”“亮点二”这种空标签。
- 双栏和卡片内部不得放小字密集段落；每块控制在 1 个短标题 + 1-3 行说明。
- “通用分点卡片”和“分级判断卡片”不是用户旅程或趋势的专属格式；只要正文出现分点、分级、清单、原则、风险、建议、优先级，就可以用它们做成更美观、更可读的分点分级方式。
- 不要把 Markdown 列表机械转换成一堆普通 `<p>`；当列表承担结构功能时，优先卡片化，让读者一屏能扫出层次。
- 生成 HTML 后做一次整体可读性扫描：组件之间要有节奏，不能让卡片连续堆成海报。

**🤝 确认点 3**：展示完整文章，用户可提出修改意见。

---

### 阶段 3.5：正文配图生成（gpt-image-2 → step-image-edit-2 → HTML）

用户确认完稿后，对每个 `[IMG:type]` 占位符执行生图。默认顺序：

1. **首选：`@gpt-image-2`**
2. **次选：StepFun `step-image-edit-2`**
3. **降级：现有 HTML 生图 + Playwright 截图**

#### 首选路径：gpt-image-2

如果本地已安装 `@gpt-image-2`，优先调用它的脚本：

```bash
/bin/bash ~/.claude/skills/gpt-image-2/scripts/gen.sh \
  --prompt "配图提示词" \
  --out 输出.png \
  --timeout-sec 300
```

执行规则：
- 前台同步执行，不放到后台进程静默跑。
- 显式使用 `/bin/bash /path/to/gen.sh`，避免后台环境 `PATH` 不完整导致 `exit 127`。
- 如果返回 `exit 127`，先检查 bash 路径、脚本路径和执行权限，再决定是否进入 StepFun 次选路径。

如果 skill 安装在其他目录，先在常见 skill 目录查找：

```bash
find ~/.claude/skills ~/.codex/skills ~/.agents/skills -path "*/gpt-image-2/scripts/gen.sh" -print -quit 2>/dev/null
```

如果找不到脚本，且当前环境允许联网和执行 `npx`，先尝试安装一次：

```bash
npx skills add https://github.com/agentspace-so/agent-skills --skill gpt-image-2
```

安装后重新查找 `gpt-image-2/scripts/gen.sh`；仍找不到或安装失败时再降级。

配图提示词必须包含：
- 画幅：`1200x800` 或 `3:2 horizontal infographic`
- 文章标题、章节位置、占位符类型（`arch/compare/flow/concept`）
- 图要表达的核心论点和信息结构
- 已确认主题的配色和气质（见 `references/themes.md`）
- 微信正文阅读约束：中文可读、层级清楚、不要小字堆叠、不要生成二维码或外部品牌水印

提示词模板：

```text
为微信公众号文章生成一张 1200x800 横版正文配图。
文章标题：{title}
章节位置：{chapter}
图类型：{arch|compare|flow|concept}
核心表达：{description}
视觉主题：{theme_name}，主色 {accent_color}，背景 {background_color}，整体气质 {tone}
要求：中文标签清晰可读，信息层级为标题、主体结构、底部一句结论；不要二维码、水印、Logo；不要密集小字。
```

gpt-image-2 成功标准：
- 命令退出码为 0
- 输出文件存在且大小大于 0
- 用 `view_image` 或系统图片预览检查后，主体不空白、中文可读、构图无明显裁切
- 上传前将正文图归一化为 1200×800；如果原图比例已经接近 3:2，可直接等比缩放/轻微裁切，不要拉伸到变形

macOS 可用 `sips` 做接近比例的最终尺寸归一化：

```bash
sips -z 800 1200 原始正文图.png --out 正文图.png
```

以下情况立即进入 StepFun 次选路径，不要反复卡住用户流程：
- `gpt-image-2/scripts/gen.sh` 找不到
- `codex` CLI、登录态、ChatGPT 图像权益不可用
- 命令超时、退出码非 0、没有图片 payload
- 图片明显跑题、空白、文字严重不可读，且重新生成一次仍不可用

例外：如果用户明确要求 gpt-image-2 产图用于验收，不要用 step-image-edit-2 或 HTML/Playwright 降级图替代验收稿；应说明失败原因并继续重试或让用户决定是否接受降级。

#### 次选路径：StepFun step-image-edit-2

当 `@gpt-image-2` 不可用或无有效产出，且用户没有明确限定“只能用 gpt-image-2”时，尝试 StepFun `step-image-edit-2`。该路径使用 Step Plan 专用地址：

```bash
python3 scripts/generate_step_image.py --check-env
export STEP_API_KEY="你的 StepFun API Key"
python3 scripts/generate_step_image.py \
  --mode body \
  --prompt "正文配图提示词（不超过 512 个字符）" \
  --out body-step-raw.png
```

StepFun 配置固定值：
- Base URL：`https://api.stepfun.com/step_plan/v1`
- Endpoint：`POST /images/generations`
- Model：`step-image-edit-2`
- `response_format`：`b64_json`
- `cfg_scale`：`1.0`
- `steps`：`8`
- `text_mode`：`true`（正文配图和封面通常含中文标题/标签）
- 默认正文尺寸：`896x1184`，注意 StepFun 文档里的格式是 `height x width`

首次使用或环境不确定时，先执行 `python3 scripts/generate_step_image.py --check-env`。如果返回缺少 `STEP_API_KEY`，按下面格式引导用户：

```text
StepFun 次选生图需要你自己的 StepFun API Key。
请在 StepFun 平台开通 Step Plan 并创建 API Key，然后在本机配置：
export STEP_API_KEY="your_stepfun_api_key"
配置后运行：python3 scripts/generate_step_image.py --check-env
本 skill 使用的 Base URL 是：https://api.stepfun.com/step_plan/v1
```

不要把用户提供的 key 写入仓库、README、测试文件或文章素材目录；只放在用户自己的 shell 环境或本机安全配置里。

StepFun 提示词比 gpt-image-2 更短，必须压缩到 512 字符内。正文配图提示词保留这些信息即可：文章标题、章节位置、图类型、核心表达、主题配色、中文可读、不要二维码/水印/Logo/密集小字。

StepFun 成功标准：
- 命令退出码为 0
- 输出文件存在且大小大于 0
- API 返回 `finish_reason=success`
- 用 `view_image` 或系统图片预览检查后，主体不空白、中文可读、构图无明显裁切
- 上传前将正文图归一化为 1200×800；StepFun 默认正文尺寸接近 4:3，归一化时允许轻微裁切，不要拉伸变形

macOS 可继续用 `sips` 做最终尺寸归一化：

```bash
sips -z 800 1200 body-step-raw.png --out 正文图.png
```

以下情况再进入 HTML/Playwright 降级：
- `STEP_API_KEY` 未配置
- Step Plan Base URL 使用错误或返回鉴权/限额/HTTP 错误
- 命令超时、退出码非 0、没有图片数据
- API 返回 `content_filtered` 或其他非 `success` 状态
- 图片明显跑题、空白、中文严重不可读，且重新生成一次仍不可用

实测提醒：`step-image-edit-2` 的 API 可用性和出图速度较好，但中文信息图可能出现错字、乱码或伪二维码块。必须按成功标准人工预览；如果中文不可读或出现二维码样式噪点，即使 API 调用成功，也应重试一次或进入 HTML/Playwright 降级。

如果使用 StepFun 成功，最终报告写：`正文图 X 已因 gpt-image-2 不可用/无有效产出，改用 step-image-edit-2 生成。`
如果 StepFun 也失败，再写：`正文图 X 已因 gpt-image-2 与 step-image-edit-2 均不可用/无有效产出，改用 HTML 截图生成。`

#### 降级路径：HTML 生图 + 截图

**步骤 1：编写 HTML**

根据占位符的类型和描述，编写独立的 HTML 文件来渲染图表。要求：
- 尺寸 1200×800，字体用系统自带中文字体（PingFang SC, Hiragino Sans GB, Microsoft YaHei）
- 匹配选定主题的配色体系（深色主题用暗背景，浅色主题用亮背景）
- 可以有渐变、阴影、圆角（输出是图片，不受微信 CSS 限制）
- 信息层级清晰：标题 → 主体内容 → 底部结论

**步骤 2：截图**

```bash
cd /tmp && npm install playwright
cd /tmp && npx playwright screenshot "file://绝对路径.html" 输出.png --wait-for-timeout 2000
```

注意：用 `npx playwright` CLI（Node.js 版），不用 Python playwright（可能未安装）。如果在 `/tmp/wechat_article` 等临时目录里 `require('playwright')` 找不到模块，根因通常是 Node.js 按当前目录查找 `node_modules`；先 `cd /tmp && npm install playwright`，再从 `/tmp` 运行截图脚本。

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

封面也采用同样的三层策略：先用 `@gpt-image-2` 生成 900×383 封面；失败后尝试 StepFun `step-image-edit-2`；仍失败时保留 `@generate-wechat-theme` publish 脚本内置封面生成。

#### 首选路径：gpt-image-2 封面

封面提示词必须围绕“缩小后仍可读”设计，不要把完整长标题塞进封面。同时必须加入 **2 个具体惊艳点**，让 gpt-image-2 有明确的视觉发挥空间，避免封面只变成普通信息卡片。

两个惊艳点的写法：
- **惊艳点 1：反常规视觉锚点**。用一个和文章主题强相关、但不落俗套的主体隐喻承载标题，例如“悬浮的操作系统调度中枢”“由任务队列构成的城市天际线”“像仪表盘一样展开的认知地图”。
- **惊艳点 2：材质/光影/空间记忆点**。指定一种能让画面别具一格的视觉处理，例如“半透明玻璃拟物层叠”“微缩沙盘式 3D 纵深”“纸张纹理叠加冷峻金属边框”“低饱和霓虹边缘光”。

惊艳点要服务主题和标题可读性：每个惊艳点用 1 句写清楚，不要堆 5 个以上视觉元素，不要让装饰压过主标题。

```bash
bash ~/.claude/skills/gpt-image-2/scripts/gen.sh \
  --prompt "封面提示词" \
  --out cover.png \
  --timeout-sec 300
```

封面提示词模板：

```text
为微信公众号文章生成一张 900x383 横版封面图。
完整标题：{title}
封面主标题：{cover_main}（6-10 个中文字符）
封面副标题：{cover_subtitle}
视觉主题：{theme_name}，主色 {accent_color}，背景 {background_color}，整体气质 {tone}
惊艳点 1（反常规视觉锚点）：{wow_point_1}
惊艳点 2（材质/光影/空间记忆点）：{wow_point_2}
要求：公众号草稿卡片缩小后主标题仍清晰可读；两个惊艳点必须能被看见但不能压过主标题；主体居中或有明确视觉重心；不要二维码、水印、Logo；不要密集小字。
```

封面检查标准：
- gpt-image-2 原始输出允许不是精确 900×383，但必须接近 2.35:1 横版比例
- 上传前必须把封面归一化为精确 900×383；如果原图比例已经接近 2.35:1，可直接等比缩放/轻微裁切，不要拉伸到变形
- 主标题清楚，中文不是方块，不被裁切
- 画面中能识别出 2 个惊艳点：一个主题隐喻锚点，一个材质/光影/空间记忆点
- 惊艳点没有制造视觉噪音，缩小预览时仍然先读到主标题
- 缩小预览时还能读出核心信息

macOS 可用 `sips` 做接近比例的最终尺寸归一化：

```bash
sips -z 383 900 原始封面.png --out cover.png
```

如果 gpt-image-2 封面成功，上传封面时仍使用封面素材接口：

```http
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=TOKEN&type=image
```

如果后续仍调用 `@generate-wechat-theme` 的 publish 脚本创建了一个带内置封面的临时草稿，则最终要用 gpt-image-2 封面重新创建新草稿，并在新草稿成功后删除临时草稿，保持“先创后删”。

#### 次选路径：StepFun step-image-edit-2 封面

当 `@gpt-image-2` 封面不可用或无有效产出，且用户没有明确要求只能用 gpt-image-2 验收时，尝试 StepFun `step-image-edit-2` 生成封面：

```bash
python3 scripts/generate_step_image.py \
  --mode cover \
  --prompt "封面提示词（不超过 512 个字符）" \
  --out cover-step-raw.png
```

封面提示词要比 gpt-image-2 版本更短，但仍保留：
- 封面主标题（6-10 个中文字符）和副标题
- 文章主题隐喻或反常规视觉锚点
- 主题主色、背景色、整体气质
- 材质/光影/空间记忆点
- 公众号缩略图约束：主标题清晰、不要二维码、水印、Logo、密集小字

StepFun 封面配置：
- Base URL：`https://api.stepfun.com/step_plan/v1`
- Model：`step-image-edit-2`
- 默认封面尺寸：`768x1360`，注意格式是 `height x width`
- `response_format=b64_json`、`cfg_scale=1.0`、`steps=8`、`text_mode=true`

封面检查标准与 gpt-image-2 一致，但要额外注意 StepFun 默认比例是 16:9，最终裁切到 900×383 时上下会被裁掉一部分；提示词必须要求“主标题和主体视觉集中在画面中央安全区”。上传前归一化：

```bash
sips -z 383 900 cover-step-raw.png --out cover.png
```

如果 StepFun 封面成功，上传封面时仍使用封面素材接口：

```http
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=TOKEN&type=image
```

如果后续仍调用 `@generate-wechat-theme` 的 publish 脚本创建了一个带内置封面的临时草稿，则最终要用 StepFun 封面重新创建新草稿，并在新草稿成功后删除临时草稿，保持“先创后删”。

#### 降级路径：generate-wechat-theme 内置封面

当 gpt-image-2 与 step-image-edit-2 都不可用或封面无有效产出时，可调用 `@generate-wechat-theme` 的 publish 脚本生成基础草稿或借用其转换能力：

注意：如果用户明确要求 gpt-image-2 封面用于验收，StepFun 和本节降级路径都不得用于创建验收草稿。

```bash
python3 ~/.claude/skills/generate-wechat-theme/scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "标题" \
  --author "" \
  --digest "摘要" \
  --themes <匹配的主题名>
```

正式发布前必须处理两个脚本副作用：
- `publish_multi_theme.py` 会把主题名称追加到标题，例如 `标题 | 清新科技风`。正式草稿不得使用这个标题；最终创建草稿时必须改回纯文章标题。
- `md_to_wechat_html()` 会追加主题页脚，例如 `· 清新科技风 ·`。正式正文不得保留这个页脚；最终 HTML 必须删除这类内部风格页脚。

**如果文章含图片**，需要：
1. 先用 publish 脚本生成不带图的草稿
2. 后处理 HTML 替换占位符为 `<img>` 标签
3. 若 gpt-image-2 或 step-image-edit-2 封面成功，上传该封面并使用返回的 `thumb_media_id`；否则使用 publish 脚本生成的基础封面
4. 删除正文中的内部风格页脚，确认标题和正文没有主题/风格名称
5. **重新创建新草稿**（手动调 API，注意 `ensure_ascii=False`；`author` 传空字符串）
6. 新草稿成功后删除旧草稿

草稿清理规则：
- 发布前先查询草稿列表，按标题、创建时间或本次运行记录动态获取要删除的 `media_id`。
- 禁止硬编码 `OLD_DRAFT`；多次运行后硬编码 ID 可能已不存在，会让中间版本遗留在草稿箱。
- 删除旧草稿前先确认新草稿创建成功；删除旧草稿失败时记录具体 `media_id` 和错误码，不要回滚新草稿。
- 如果要替换上一版，优先使用用户显式提供的 `replace-media-id`；未提供时再从草稿列表中动态匹配。

**字段限制速查**（`ensure_ascii=True` 时极易触发）：

| 字段 | 限制 |
|------|------|
| title | 64 字符（含主题后缀预留 10 字符） |
| author | 留空字符串，等用户自己填写 |
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

## 三、微信渲染与工程执行硬规则

### 3.1 Python 临时脚本写法

当需要生成包含大量中文内容、中文引号或文章 HTML 的 Python 临时脚本时，禁止用 Write 工具直接写入复杂字符串。优先使用 bash heredoc，固定写法：

```bash
cat > /tmp/wechat_article/render_article.py << 'ENDOFSCRIPT'
# Python code here
ENDOFSCRIPT
```

这类 heredoc 使用 `<< 'ENDOFSCRIPT'`，可以避免中文内容里的 `"工具尝鲜"`、弯引号、HTML 属性引号把 Python 字符串边界打乱。若在 Codex 环境中编辑仓库文件，仍按本环境规则用 `apply_patch`；这条规则主要约束生成一次性脚本或 Claude Code 的 Write 工具场景。

### 3.2 Emoji 写法

WeChat HTML 中 emoji 必须用真实 UTF-8 字符，例如 `🔵`、`⚡`、`✅`。禁用 HTML 数字实体，例如 `&#128309;`、`&#9889;`。浏览器能解析数字实体，但微信公众号渲染可能把它当字面文本输出，造成乱码。

### 3.3 对比度检查

生成 HTML 后必须检查所有「背景色 + 文字色」组合的可读性：
- 对比度检查不是只看局部组件；要放到当前主题背景上验证。
- 深色 badge、表头、提示盒如果使用白字，必须确认最终背景不是白色或浅色覆盖导致白字不可见。
- 主题切换后重新检查所有组件，不复用上一主题的颜色假设。
- 检查范围包括章节标题徽章、表头、卡片标题、强调文字、链接、提示盒标题、页脚。

---

## 四、常见问题速查

| 问题 | 原因 | 解决 |
|------|------|------|
| 标题/作者/摘要 长度超限 | `json.dumps` 默认 `ensure_ascii=True`，中文转 `\uXXXX` 膨胀 3-6 倍 | 必须 `ensure_ascii=False` + `.encode('utf-8')` |
| `[IMG]` 占位符原样显示 | markdown→HTML 转换器把占位符当文本 | 在 HTML 生成后做后处理替换 |
| Playwright 截图空白 | webfont/CSS 未加载完 | `--wait-for-timeout 2000` |
| Playwright 模块找不到 | 在 `/tmp/wechat_article` 等临时目录执行，Node.js 找不到 `/tmp/node_modules` | 先 `cd /tmp && npm install playwright`，再从 `/tmp` 运行截图脚本 |
| 正文图片不显示 | 用了 `material/add_material` 而非 `media/uploadimg` | 正文图用 `media/uploadimg` |
| `npx playwright` 未找到 | Chromium 浏览器未安装 | `npx playwright install chromium`（一次性） |
| gpt-image-2 exit 127 | 后台进程 `PATH` 不完整或 bash 路径不可见 | 前台同步执行，显式使用 `/bin/bash /path/to/gen.sh` |
| Python 脚本中文引号语法错误 | 直接写入大量中文字符串，引号边界被打乱 | 用 bash heredoc：`<< 'ENDOFSCRIPT'` |
| emoji 数字实体乱码 | WeChat 不解析 HTML 数字实体 emoji | 用真实 UTF-8 字符，禁用 HTML 数字实体 |
| badge/表头文字不可见 | 背景色和文字色在当前主题下对比度不足 | 对所有「背景色 + 文字色」组合做对比度检查 |
| `gpt-image-2` 找不到 | 未安装外部生图 skill | 执行 `npx skills add https://github.com/agentspace-so/agent-skills --skill gpt-image-2`，本次先降级 |
| gpt-image-2 无图产出 | Codex CLI 未登录、图像权益不可用、网络/模型失败 | 记录原因，尝试 step-image-edit-2；若用户明确要求 gpt-image-2 验收则先停下 |
| step-image-edit-2 无图产出 | `STEP_API_KEY` 未配置、Step Plan Base URL 用错、额度/鉴权/网络失败、提示词超过 512 字符 | 确认 `STEP_API_KEY` 和 `https://api.stepfun.com/step_plan/v1`，重试一次；仍失败再改用 HTML/Playwright 或内置封面 |
| 标题/正文出现风格名 | 直接使用了 publish 脚本追加的标题或页脚 | 最终创建草稿前删除主题后缀和主题页脚，作者字段留空 |
| 旧草稿没有被清理 | `OLD_DRAFT` 硬编码指向已不存在的 media_id | 发布前查询草稿列表，动态获取要删除的 media_id，禁止硬编码 OLD_DRAFT |

---

## 五、资源文件

- `references/style-guide.md` — 作者个人风格完整指南（9 篇文章分析结果）
- `references/themes.md` — 6 套视觉主题的完整色彩定义（微信 CSS 兼容版）
- `scripts/generate_step_image.py` — StepFun `step-image-edit-2` 次选生图脚本（Step Plan API）
- `scripts/upload_body_images.py` — 批量上传正文图片到微信 CDN
- `@generate-wechat-theme` — 已有的排版/封面/发布 skill，封面生成和基础草稿创建调用它
- `@gpt-image-2` — 首选封面和正文配图生成 skill；未安装或失败时不阻塞发布，降级保留现有方式
- StepFun `step-image-edit-2` — 次选封面和正文配图生成模型；需要 `STEP_API_KEY`，默认使用 `https://api.stepfun.com/step_plan/v1`
