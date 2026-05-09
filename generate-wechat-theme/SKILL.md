---
name: generate-wechat-theme
description: |
  微信公众号文章排版与发布完整工作流。根据用户提供的 Markdown/文章内容和视觉风格需求，生成微信兼容的内联样式 HTML、可读封面图，并按需发布到公众号草稿箱。必须在用户提到「发布公众号」「公众号文章」「公众号排版」「wechat publish」「微信排版」「公众号草稿箱」「推文发布」「公众号样式」「公众号主题」「把 Markdown 发到公众号」时使用，即使用户没有明确说“使用 skill”。也用于修复公众号草稿中的封面、代码块、列表、样式兼容和版本替换问题。
---

# 微信公众号文章排版与发布

这是「Markdown → 微信兼容 HTML → 公众号草稿箱」的完整工作流。

## Skill 资源与使用方式

- 主要脚本：`scripts/publish_multi_theme.py`
- 旧版单主题脚本：`scripts/publish_wechat.py`（仅在需要最小流程时使用）
- 凭证位置：`~/.wechat/config`，包含 `WECHAT_APPID` 和 `WECHAT_APPSECRET`
- 常用命令：

```bash
python3 scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "文章标题" \
  --author "作者" \
  --digest "摘要" \
  --themes cyber
```

需要替换上一版草稿时，先创建新草稿，确认成功后传入旧草稿 `media_id`：

```bash
python3 scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "文章标题" \
  --themes cyber \
  --replace-media-id "旧草稿media_id"
```

---

## 第一部分：微信 CSS 兼容性规则（最重要，每次都读）

微信公众号编辑器在保存时会**大幅剥离和改写 HTML/CSS**。下面每一条都来自真实踩坑经验，不遵守会导致排版崩溃。

### 1.1 核心原则：必须内联样式

`<style>` 标签会被微信**完全删除**。所有 CSS 必须写成 `style="..."` 内联属性。

```
✅ <p style="color:#333;font-size:16px;">文本</p>
❌ <style>p { color: #333; }</style>
```

### 1.2 CSS 白名单（只有这些能存活）

| 类别 | 安全属性 |
|---|---|
| 颜色/背景 | `color`, `background-color`（仅纯色 #hex，不支持 rgba() 和 gradient） |
| 字体 | `font-size`, `font-weight`, `font-style`, `letter-spacing` |
| 对齐 | `text-align`, `text-decoration`, `text-indent`, `vertical-align` |
| 间距 | `margin`, `padding`, `line-height` |
| 边框 | `border`, `border-left/right/top/bottom`（支持 solid/dashed/dotted） |
| 表格 | `border-collapse`, `border-spacing` |
| 布局 | `display: block/inline/inline-block`, `width`, `height`, `max-width` |
| 其他 | `overflow`（部分支持）, `word-wrap`, `opacity`（部分支持） |

### 1.3 CSS 黑名单（一定会被剥离）

- `position: absolute/relative/fixed` — 全部删除
- `float`, `z-index` — 删除
- `box-shadow`, `border-radius` — 删除
- `background-image`, `linear-gradient()`, `radial-gradient()` — 删除
- `rgba()` 颜色值 — 删除，改用 `#hex`
- `transform`, `animation`, `transition` — 删除
- `text-shadow` — 删除
- `::before` / `::after` 伪元素 — inline style 中不可能出现

### 1.4 HTML 标签限制

| 标签 | 问题 | 替代方案 |
|---|---|---|
| `<style>` | 被完全删除 | 内联 `style="..."` |
| `<ol>`, `<ul>`, `<li>` | 微信强制覆盖 list-style，序号丢失、符号错乱 | 用 `<p>` + 显式序号/符号 |
| `<section>` 嵌套 | 可能被编辑器展开破坏 | 仅最外层用一个 section |

### 1.5 装饰效果替代表

| 想要的效果 | 不能用 | 用这个 |
|---|---|---|
| 波浪下划线 | `background-image: url(svg...)` | Unicode 字符 `〰〰〰〰` |
| 荧光笔高亮 | `linear-gradient` 背景 | 纯色 `background-color: #fff176` |
| 竖条装饰 | `::before` + gradient | `border-left: 5px solid #ffeb3b` |
| 手绘分割线 | SVG wave | 字符装饰 `· · · ✦ · · ·` |
| 图标 | `::before { content: "✦" }` | HTML 直接写 `✦` |
| 装订线 | `position: absolute` | 用 `border-left` 或直接省略 |

### 1.6 Unicode 装饰字符

`✦` 星标 `〰` 波浪 `◦` 手绘圆点 `✎` 铅笔 `📝` 备忘录 `💡` 重点 `✏️` 签名 `⭐` 强调 `·` 分隔 `—` 破折号 `↓` 箭头

---

## 第二部分：Markdown → 微信 HTML 转换规范

按以下模板生成，每个元素都有固定的安全写法。

### 2.1 标题

```html
<!-- h1 -->
<h1 style="text-align:center;font-size:1.65em;font-weight:900;color:#2c2c2c;
    letter-spacing:1px;margin:1.2em 0 0.4em;padding:12px 20px;">
  ✦ 标题文字
</h1>
<p style="text-align:center;font-size:15px;color:#e06060;
    letter-spacing:4px;margin:0 0 1em 0;">〰〰〰〰〰〰〰〰〰〰</p>

<!-- h2 -->
<h2 style="font-size:1.3em;font-weight:700;color:#3a5a8c;
    margin:1.8em 0 0.4em;padding:6px 0 6px 12px;
    border-left:5px solid #ffeb3b;">标题文字</h2>
<p style="border-bottom:2px dashed #b0c4de;margin:0 0 0.8em 0;
    height:0;font-size:0;line-height:0;overflow:hidden;">-</p>

<!-- h3 -->
<h3 style="font-size:1.15em;font-weight:600;color:#4a6a5a;
    margin:1.4em 0 0.5em;padding-left:4px;">✎ 标题文字</h3>
```

### 2.2 段落

```html
<p style="letter-spacing:0.5px;line-height:1.9;margin:0.8em 0;color:#3a3a3a;">
  段落文字...
</p>
```

### 2.3 列表（绝不用 ol/ul/li）

```html
<!-- 无序列表 -->
<p style="padding-left:24px;margin:0.35em 0;line-height:1.8;
    letter-spacing:0.5px;color:#3a3a3a;">
  <span style="color:#8b7355;">◦</span> 列表项
</p>

<!-- 有序列表 -->
<p style="padding-left:24px;margin:0.35em 0;line-height:1.8;
    letter-spacing:0.5px;color:#3a3a3a;">
  <strong style="color:#3a5a8c;font-weight:700;">1.</strong> 第一项
</p>
```

### 2.4 表格

```html
<table style="border-collapse:collapse;margin:1.4em auto;max-width:100%;
    text-align:left;font-size:15px;border:2px solid #8b7355;">
  <thead><tr>
    <th style="background-color:#e8dcc8;color:#3a3a3a;font-weight:700;
        padding:10px 14px;border-bottom:2px solid #8b7355;text-align:center;">
      列名
    </th>
  </tr></thead>
  <tbody>
    <tr>
      <td style="padding:9px 14px;border-bottom:1px dashed #c4b896;
          color:#4a4a4a;vertical-align:top;line-height:1.6;">内容</td>
    </tr>
  </tbody>
</table>
```

### 2.5 引用块

```html
<blockquote style="background-color:#fff9c4;border-left:4px solid #f9a825;
    margin:1.5em 0;padding:12px 16px;font-size:15px;color:#5d4e37;">
  <p style="margin:0 0 6px 0;font-size:0.85em;">📝</p>
  <p style="margin:4px 0;letter-spacing:0.5px;line-height:1.9;color:#5d4e37;">
    引用文字
  </p>
</blockquote>
```

### 2.6 代码块

代码块不要把整段代码塞进一个 `<code>` 里。微信公众号对换行和空白处理不稳定，整段代码容易挤成一团。把代码块转成「外层 section + 每行一个 p + 行内 code」：

```html
<section style="border:2px dashed #8b7355;margin:1.4em 0;padding:20px 16px 16px;
    font-size:13px;line-height:1.65;overflow-x:auto;background-color:#f9f3e3;">
  <p style="font-size:13px;color:#8b6914;font-weight:700;margin:0 0 8px 0;">CODE</p>
  <p style="margin:0 0 4px 0;line-height:1.65;word-wrap:break-word;">
    <code style="color:#4a3f2f;font-size:13px;">第一行代码</code>
  </p>
  <p style="margin:0 0 4px 0;line-height:1.65;word-wrap:break-word;">
    <code style="color:#4a3f2f;font-size:13px;">&nbsp;&nbsp;缩进行代码</code>
  </p>
</section>
```

代码块转换规则：

1. 对代码中的 `<`, `>`, `&` 做 HTML 转义，避免示例里的 `<style>`、`<ul>` 被微信当成真实标签。
2. 保留缩进：行首空格转成 `&nbsp;`。
3. 保留空行：空行转成只包含 `&nbsp;` 的代码行。
4. 长行用 `word-wrap:break-word`，不要依赖复杂横向滚动。

### 2.7 行内格式

```html
<strong style="color:#2c2c2c;font-weight:700;border-bottom:2px solid #f39c12;
    padding-bottom:1px;">加粗强调</strong>

<em style="background-color:#fff176;font-style:normal;padding:0 3px;">荧光笔高亮</em>

<code style="color:#c0392b;background-color:#fef9e7;padding:2px 6px;font-size:14px;
    border-bottom:1px dotted #c0392b;">行内代码</code>

<a href="URL" style="color:#2962a0;text-decoration:none;
    border-bottom:1px dashed #2962a0;">超链接</a>
```

### 2.8 分割线与容器

```html
<!-- 分割线 -->
<p style="text-align:center;margin:2em 0;color:#b8a88a;
    font-size:15px;letter-spacing:6px;">· · · ✦ · · ·</p>

<!-- 外层容器 -->
<section style="line-height:1.85;font-size:16px;color:#3a3a3a;
    padding:20px 16px 30px;background-color:#fdf6e3;">
  ...所有内容...
</section>
```

---

## 第三部分：主题风格生成

根据用户描述的视觉风格，只调整安全白名单内的参数：

| 可变参数 | 示例值 |
|---|---|
| 底色 `background-color` | `#ffffff`（白底）/ `#fdf6e3`（米黄）/ `#1a1a2e`（深色） |
| 文字色 `color` | `#333333` / `#2c2c2c` |
| 强调色（border/strong/em） | `#ffeb3b`（黄）/ `#f39c12`（橙）/ `#3a5a8c`（蓝）/ `#c0392b`（红） |
| 标题装饰字符 | `✦` / `⭐` / `🔥` / `💡` |
| 分割线字符 | `· · · ✦ · · ·` / `— — —` / `···` |

### 预置风格速查

**课堂手写笔记风**（实战验证）：
- 底色 `#fdf6e3`（浅黄纸）
- h1: `✦` 前缀 + `〰〰〰` 波浪
- h2: `border-left:5px solid #ffeb3b` 荧光笔竖条 + dashed 下划线
- strong: `border-bottom:2px solid #f39c12` 橙线
- em: `background-color:#fff176` 黄底高亮
- 引用块: `#fff9c4` 底 + `#f9a825` 左边框
- 表格: `#e8dcc8` 表头 + `#fdf8ec` 偶数行

**极简科技风**：
- 底色 `#ffffff`
- h1/h2: `color:#1a1a1a` + `border-bottom:2px solid #333`
- strong: 纯加粗，无装饰
- em: `background-color:#f5f5f5`
- 代码块: `#f7f7f7` 底 + `#e0e0e0` 边框

**赛博朋克霓虹风**（适合深色背景 + 技术主题）：
- 底色 `#090b1a`
- 主文字 `#d7e8ff`，标题霓虹青 `#00f5ff`
- 强调色：粉 `#ff2bd6`、绿 `#39ff14`、黄 `#ffea00`
- h2: 青色左边框 + 粉色虚线
- 代码块: 深黑底 + 青色 dashed 边框 + 逐行代码
- 表格: 紫色表头 + 青色文字 + 深色隔行底

生成规则：
1. 全部内联，不输出 `<style>` 标签
2. 每种元素 2-3 个视觉特征（颜色、边框、间距）
3. 装饰用 Unicode 字符嵌入 HTML，不用伪元素
4. 表格 `<thead>` 和 `<tbody>` 必须不同底色
5. 不使用渐变、阴影、圆角、定位

---

## 第四部分：封面图生成规范

公众号封面是 900×383（约 2.35:1）。封面在草稿卡片里会被缩小预览，因此设计目标不是“放下完整标题”，而是“缩小后仍能读出核心信息”。

### 4.1 封面设计原则

1. 主标题用 1 行核心概念，尽量 6-10 个中文字符；不要直接塞完整文章标题。
2. 主体居中，占据画面中部 60%-75% 宽度；避免全部堆在左侧造成右侧空白。
3. 字号要足够大：900×383 中中文主标题建议 64-76px，副标题 44-56px，小标签 24-30px。
4. 先加载可显示中文的系统字体，不要假设 `PingFang.ttc` 存在。macOS 优先尝试：
   - `/System/Library/Fonts/STHeiti Medium.ttc`
   - `/System/Library/Fonts/STHeiti Light.ttc`
   - `/System/Library/Fonts/Hiragino Sans GB.ttc`
   - `/System/Library/Fonts/Supplemental/Songti.ttc`
5. 装饰只能服务主体：网格、边框、霓虹线都要弱化，不能让封面像调试稿。

### 4.2 封面踩坑总结

| 问题 | 原因 | 修复 |
|---|---|---|
| 中文变成方块 | PIL 加载了不存在或不含中文的字体 | 自动遍历中文字体路径 |
| 字体看起来很小 | 使用完整长标题，字号被迫降低 | 提炼短主标题，使用大字号 |
| 构图失衡 | 文字堆在左侧，右侧只有空网格 | 主标题居中，减少无效背景 |
| 公众号卡片不清楚 | 预览图会被缩小 | 本地 `view_image` 或截图检查缩小效果 |

### 4.3 生成与检查

脚本支持封面标题覆盖：

```bash
python3 scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "完整文章标题" \
  --themes cyber \
  --cover-main "公众号自动排版发布" \
  --cover-subtitle "Claude Code"
```

发布前必须查看本地封面图。若封面在原图中看起来“刚好”，缩到公众号卡片里通常会偏小；应继续放大或减少文字。

---

## 第五部分：发布到公众号草稿箱

### 5.1 首次配置（一次性）

引导用户在 `~/.wechat/config` 配置凭证：

```bash
mkdir -p ~/.wechat
echo 'WECHAT_APPID=wxXXXXXXXXXXXXXXXX' >> ~/.wechat/config
echo 'WECHAT_APPSECRET=your_secret' >> ~/.wechat/config
chmod 600 ~/.wechat/config
```

⚠️ **安全提醒**：AppSecret 一旦在对话中出现过，发布后立即提醒用户重置。

### 5.2 发布步骤

```
[1] 读取 Markdown → [2] 转换 HTML → [3] 兼容性检查 → [4] 生成封面 → [5] 获取 token → [6] 上传封面 → [7] 创建草稿
```

#### Step 1-3：读取、转换、检查

从用户路径读 `.md` 文件，按第二部分规范转为内联样式 HTML，生成预览 `.html` 文件。

发布前扫描：

- 无 `<style>`、`<ol>`、`<ul>`、`<li>`
- 样式中无 `position`、`box-shadow`、`border-radius`、`linear-gradient`、`rgba()`、`transform`、`animation`
- 行内代码和代码块内容已转义 `<`、`>`、`&`

#### Step 4：生成封面图

用 Python PIL 生成 900×383（比例 2.35:1）的封面图，风格匹配文章主题：

```python
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGB', (900, 383), '#fdf6e3')
draw = ImageDraw.Draw(img)
# 绘制标题 + 装饰
img.save('cover.png', 'PNG')
```

#### Step 5：获取 access_token

```
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
→ {"access_token": "...", "expires_in": 7200}
```

#### Step 6-7：上传封面 + 创建草稿

先上传封面素材（multipart/form-data）：
```
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=TOKEN&type=image
→ {"media_id": "..."}
```

再创建草稿（JSON）：
```json
POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=TOKEN
{
  "articles": [{
    "title": "标题",
    "author": "作者",
    "digest": "摘要",
    "content": "HTML（全部内联样式）",
    "thumb_media_id": "上一步的media_id",
    "content_source_url": "",
    "need_open_comment": 0,
    "only_fans_can_comment": 0
  }]
}
```

#### 可选：发布

```
POST https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=TOKEN
{"media_id": "草稿media_id"}
```

订阅号无此 API 权限（返回 48001），需引导用户去草稿箱手动群发。

### 5.3 错误码速查

| errcode | 含义 | 处理 |
|---|---|---|
| 40164 | IP 不在白名单 | 用 `curl ifconfig.me` 获取出口 IP，去公众号后台→设置与开发→基本配置→IP白名单添加 |
| 40007 | 缺少 thumb_media_id | 检查封面图是否上传成功 |
| 48001 | API 未授权 | 订阅号不支持 API 发布，手动去草稿箱发布 |
| 40001 | token 过期 | 重新获取 |

### 5.4 使用打包脚本

优先使用 `scripts/publish_multi_theme.py`：

```bash
python3 scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "标题" \
  --author "作者" \
  --digest "摘要" \
  --themes cyber
```

脚本从 `~/.wechat/config` 读取凭证，无凭证时交互询问。

---

## 第六部分：发布和迭代检查清单

每次发布前逐项确认：

- [ ] 全部样式内联，无 `<style>` 标签
- [ ] 未使用 `position`、`box-shadow`、`border-radius`、`linear-gradient`、`rgba()`
- [ ] 未使用 `<ol>`、`<ul>`、`<li>`，列表用 `<p>` + 显式序号/符号
- [ ] 装饰用 Unicode 字符（✦ 〰 ◦ ✎ 📝 💡 ✏️），不用伪元素
- [ ] 表格用 solid/dashed border + 纯色 `background-color`
- [ ] 代码块逐行渲染，缩进和空行可读
- [ ] 封面图主标题足够大，中文字体正常，不是方块
- [ ] 封面构图居中或有明确视觉重心，没有大面积无效空白
- [ ] 封面图已上传，`thumb_media_id` 已传入草稿
- [ ] 提醒用户在草稿箱确认效果
- [ ] 若重发修正版，创建新草稿成功后再删除旧草稿
- [ ] AppSecret 如在对话中出现过，提醒重置

### 6.1 迭代流程

当用户反馈“封面不正常”“代码块乱”“排版有问题”时：

1. 先定位问题类型：正文 HTML、封面图、微信草稿卡片预览、还是 API 发布流程。
2. 本地修复并生成预览文件，不要直接反复发布无法检查的版本。
3. 查看本地封面图，确认字体、大小和构图。
4. 重新创建新草稿。
5. 新草稿成功后再删除旧草稿，避免用户误用旧版本。
6. 最终回复给用户新的 `media_id`、本地预览路径、旧草稿删除结果。
