# generate-wechat-theme

> Claude Code 技能：微信公众号文章排版与发布完整工作流

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**generate-wechat-theme** 是一个 [Claude Code](https://claude.ai/code) 技能（Skill），专为微信公众号创作者设计。它能够根据你提供的文章内容和视觉风格需求，自动生成微信兼容的内联样式 HTML，并支持一键发布到公众号草稿箱。

## 预览

只需用自然语言描述你想要的文章风格，AI 就能生成对应的微信排版主题：

- 🎨 "赛博朋克风格，深色背景，霓虹色标题"
- 🌸 "清新文艺风，浅粉色调，圆角卡片引用块"
- 📝 "极简技术博客风，无衬线字体，代码块深色主题"

## 功能特性

- **多主题支持** — 内置 4 种视觉风格：简约专业风、清新科技风、暖色人文风、赛博朋克霓虹风
- **自然语言转 CSS** — 用自然语言描述视觉需求，自动生成符合微信公众号排版规范的 CSS 样式
- **微信 DOM 兼容** — 严格遵循 `#wenyan` 命名空间约束，确保样式在微信公众号编辑器中正确渲染
- **全元素覆盖** — 支持标题 (H1-H6)、段落、引用块、代码块、分割线、超链接、图片、表格等所有常用排版元素
- **HTML 兼容性检查** — 自动扫描生成的 HTML，确保不使用微信不支持的 CSS 属性
- **封面图生成** — 根据主题风格自动生成 900×383 封面图，支持中文字体
- **一键发布** — 生成样式后可直接推送到公众号草稿箱，无缝衔接发布流程

## 项目结构

```
generate-wechat-theme/
├── SKILL.md                      # Claude Code 技能定义文档
├── evals/
│   └── evals.json                # 技能评估用例
└── scripts/
    ├── publish_multi_theme.py    # 多主题发布脚本（推荐）
    └── publish_wechat.py         # 单主题发布脚本（旧版）
```

## 预置主题

| 主题 | 风格描述 | 适用场景 |
| :--- | :--- | :--- |
| **minimal** | 简约专业风，黑白灰配色 | 技术文档、正式报告 |
| **tech** | 清新科技风，蓝色主调 | AI/技术博客、产品介绍 |
| **warm** | 暖色人文风，橙棕色调 | 知识科普、生活分享 |
| **cyber** | 赛博朋克霓虹风，深色背景 | 创意内容、技术演示 |

## 前置条件

### 1. 安装 Claude Code

本技能基于 Claude Code 运行，请先安装：

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. 获取微信公众号开发者凭证

你需要从 [微信公众平台](https://mp.weixin.qq.com/) 获取以下信息：

| 参数 | 说明 |
| :--- | :--- |
| **AppID** | 在「设置与开发 → 基本配置」中获取 |
| **AppSecret** | 在「设置与开发 → 基本配置」中生成 |

> ⚠️ **注意**：AppSecret 仅在生成时显示一次，请妥善保存。你需要将公众号 IP 加入白名单才能调用 API。

### 3. 配置微信凭证

将你的微信公众号凭证保存到 `~/.wechat/config`：

```bash
mkdir -p ~/.wechat
echo 'WECHAT_APPID=wxXXXXXXXXXXXXXXXX' >> ~/.wechat/config
echo 'WECHAT_APPSECRET=your_secret' >> ~/.wechat/config
chmod 600 ~/.wechat/config
```

## 安装技能

将此仓库克隆到 Claude Code 的技能目录：

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/pengcong2020520/generate-wechat-theme-skill.git ~/.claude/skills/generate-wechat-theme
```

然后在 Claude Code 中通过 `/generate-wechat-theme` 调用。

## 使用指南

### 基本用法

在 Claude Code 中输入：

```
/generate-wechat-theme
```

然后描述你的需求，例如：

> 帮我把这篇文章排成简约科技博客风格：蓝色主色调，代码块深色背景，引用块左边框加粗，标题居中显示。

### 命令行用法

#### 多主题发布（推荐）

```bash
python3 scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "文章标题" \
  --author "作者" \
  --digest "摘要" \
  --themes cyber
```

支持的参数：

| 参数 | 说明 |
| :--- | :--- |
| `--article` | Markdown 文章路径（必填） |
| `--title` | 文章标题（必填） |
| `--author` | 作者名称 |
| `--digest` | 文章摘要 |
| `--themes` | 主题列表，逗号分隔：`minimal,tech,warm,cyber` |
| `--cover-main` | 封面主标题（留空时自动推断） |
| `--cover-subtitle` | 封面副标题（留空时自动推断） |
| `--replace-media-id` | 创建新草稿成功后删除指定旧草稿 |

#### 替换旧草稿

```bash
python3 scripts/publish_multi_theme.py \
  --article 文章.md \
  --title "文章标题" \
  --themes cyber \
  --replace-media-id "旧草稿media_id"
```

### 工作流程

1. **描述需求** — 用自然语言告诉 AI 你想要的风格和文章内容
2. **生成 CSS** — AI 会根据你的描述生成符合微信规范的 CSS 样式表
3. **兼容性检查** — 自动扫描 HTML 确保不使用微信不支持的 CSS 属性
4. **生成封面** — 根据主题风格生成 900×383 封面图
5. **发布到草稿箱**（可选）— 确认后可直接推送到公众号草稿箱

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

## 技术说明

所有生成的 CSS 必须在 `#wenyan` 命名空间下运行，这是微信公众号编辑器的 DOM 结构约束。技能会自动处理这一限制，你无需手动添加前缀。

外部资源（如背景图片）需使用 Data URI 或 HTTPS 链接，不支持本地文件路径和 Web 字体（`@font-face`）。

## 错误码速查

| errcode | 含义 | 处理 |
| :--- | :--- | :--- |
| 40164 | IP 不在白名单 | 用 `curl ifconfig.me` 获取出口 IP，去公众号后台添加 |
| 40007 | 缺少 thumb_media_id | 检查封面图是否上传成功 |
| 48001 | API 未授权 | 订阅号不支持 API 发布，手动去草稿箱发布 |
| 40001 | token 过期 | 重新获取 |

## 致谢

本项目深受 [wenyan](https://wenyan.yuzhi.tech/) 启发，CSS 渲染机制部分参考了其在微信公众号排版领域的开创性工作。感谢 wenyan 项目为微信公众号排版生态做出的贡献。

## License

MIT © 2025
