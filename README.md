# wechat-article-publisher

> Claude Code 技能：逐字稿 → 公众号草稿箱完整工作流

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**wechat-article-publisher** 是一个 [Claude Code](https://claude.ai/code) 技能（Skill），专为微信公众号创作者设计。它能将口语化逐字稿、草稿转化为具有个人风格的公众号文章，自动匹配视觉主题，AI 生成配图，并发布到公众号草稿箱。

## 预览

只需提供逐字稿或口述内容，AI 就能完成从内容分析到草稿箱发布的全流程：

- 分析内容调性，推荐最佳视觉主题
- 生成文章大纲、配图计划
- 全文撰写，保留你的个人风格
- AI 生图（HTML 渲染 + 截图）插入正文
- 一键发布到公众号草稿箱

## 功能特性

- **逐字稿转文章** — 将口语化内容转化为结构清晰、风格统一的公众号文章
- **6 套视觉主题** — 柔和玉米、物理猫薄荷、彩虹、岩灰、墨韵、电光蓝，按内容自动匹配
- **AI 配图生成** — HTML 渲染图表 + Playwright 截图 + 微信 CDN 上传，全自动流程
- **个人风格保留** — 基于 9 篇文章分析的个人风格指南，涵盖开头钩子、段落节奏、加粗系统、比喻系统等
- **三确认点工作流** — 主题选择 → 大纲框架 → 完稿，关键节点用户把控，其余全自动
- **微信 DOM 兼容** — 严格遵循微信公众号 CSS 白名单，确保样式正确渲染
- **封面图生成** — 根据主题风格自动生成封面图
- **草稿箱管理** — 创建新草稿后自动删除旧草稿，安全替换

## 项目结构

```
wechat-article-publisher/
├── SKILL.md                          # Claude Code 技能定义文档
├── references/
│   ├── themes.md                     # 6 套视觉主题的完整色彩定义
│   └── style-guide.md                # 作者个人风格指南（9 篇文章分析）
└── scripts/
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

### 4. 安装 Playwright（用于 AI 配图）

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
2. **大纲框架 & 配图计划** — 生成文章结构大纲、开头钩子策略、结尾收束策略、核心比喻、3-5 处配图计划 → 🤝 用户确认
3. **全文撰写** — 按个人风格指南写作，配图位置用占位符标记 → 🤝 用户确认
4. **AI 生图 & 排版发布** — HTML 渲染图表 → Playwright 截图 → 上传微信 CDN → 替换占位符 → 发布草稿箱（全自动）

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

## 技术说明

所有生成的 CSS 必须在 `#wenyan` 命名空间下运行，这是微信公众号编辑器的 DOM 结构约束。

外部资源（如背景图片）需使用 Data URI 或 HTTPS 链接，不支持本地文件路径和 Web 字体（`@font-face`）。

正文图片使用 `media/uploadimg` 接口上传（非 `material/add_material`），返回微信 CDN URL 后嵌入 HTML。

## 错误码速查

| errcode | 含义 | 处理 |
| :--- | :--- | :--- |
| 40164 | IP 不在白名单 | 用 `curl ifconfig.me` 获取出口 IP，去公众号后台添加 |
| 40007 | 缺少 thumb_media_id | 检查封面图是否上传成功 |
| 48001 | API 未授权 | 订阅号不支持 API 发布，手动去草稿箱发布 |
| 40001 | token 过期 | 重新获取 |

## 致谢

本项目深受 [wenyan](https://wenyan.yuzhi.tech/) 启发，CSS 渲染机制部分参考了其在微信公众号排版领域的开创性工作。

## License

MIT © 2025
