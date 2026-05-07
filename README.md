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

- **自然语言转 CSS** — 用自然语言描述视觉需求，自动生成符合微信公众号排版规范的 CSS 样式
- **微信 DOM 兼容** — 严格遵循 `#wenyan` 命名空间约束，确保样式在微信公众号编辑器中正确渲染
- **全元素覆盖** — 支持标题 (H1-H6)、段落、引用块、代码块、分割线、超链接、图片、表格等所有常用排版元素
- **高级视觉效果** — 支持 CSS 伪元素、渐变背景、内联 SVG/Base64 图片等高级特性
- **一键发布** — 生成样式后可直接推送到公众号草稿箱，无缝衔接发布流程

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

### 3. 配置 Claude Code 环境变量

将你的微信公众号凭证设置为 Claude Code 的环境变量：

```bash
# 添加到 ~/.claude/settings.json 的 env 字段中
# 或通过 Claude Code 的 /config 命令配置
```

需要配置的环境变量：

- `WECHAT_APP_ID` — 你的公众号 AppID
- `WECHAT_APP_SECRET` — 你的公众号 AppSecret

## 安装技能

将此仓库克隆到 Claude Code 的技能目录：

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/pengcong2020520/generate-wechat-theme.git ~/.claude/skills/generate-wechat-theme
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

### 工作流程

1. **描述需求** — 用自然语言告诉 AI 你想要的风格和文章内容
2. **生成 CSS** — AI 会根据你的描述生成符合微信规范的 CSS 样式表
3. **预览渲染** — 生成的样式通过 Markdown 原文渲染为微信兼容的 HTML
4. **发布到草稿箱**（可选）— 确认后可直接推送到公众号草稿箱

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

## 致谢

本项目深受 [wenyan](https://wenyan.yuzhi.tech/) 启发，CSS 渲染机制部分参考了其在微信公众号排版领域的开创性工作。感谢 wenyan 项目为微信公众号排版生态做出的贡献。

## License

MIT © 2025
