# PTA Green Tech Daily 编辑台

这是一个可运行的 MVP，用于把“绿色新闻自动搜集 → 自动评分选题 → 自动出图 → 公众号贴图草稿”串成一条工作流。手机编辑台只作为例外情况的替换入口，不再是每日必经步骤。

它通过公众号官方 API 将封面和新闻卡上传为永久图片素材，并创建 `article_type=newspic` 的“贴图”草稿；不保存任何公众号凭证，也不模拟登录个人微信。

## 两个 Codex Skill

第一次交给客户使用时，请先阅读[客户从零使用 Codex 操作指南](docs/客户从零使用Codex操作指南.md)。

仓库包含两个可独立触发的 Skill：

- `skills/weekday-green-tech-daily/`：周二至周五扫描最近 72 小时，去重后生成 3–5 条绿色技术图片日报和公众号贴图草稿。
- `skills/monday-green-tech-weekend-roundup/`：周一只汇总刚过去的周六、周日，并与历史草稿去重。

用户克隆仓库后，可在 Codex 中打开项目并说：

```text
请安装当前仓库 green-daily/skills/weekday-green-tech-daily 和
green-daily/skills/monday-green-tech-weekend-roundup 这两个 Skill。
```

安装后分别使用：

```text
Use $weekday-green-tech-daily to prepare today’s PTA Green Tech Daily.
Use $monday-green-tech-weekend-roundup to prepare the latest weekend roundup.
```

也可以不安装，直接让 Codex 按对应目录中的 `SKILL.md` 执行。两个 Skill 都默认只创建公众号“贴图”草稿，不直接发布或群发。

克隆与初始化：

```bash
git clone https://github.com/pengcong2020520/generate-wechat-theme-skill.git
cd generate-wechat-theme-skill/green-daily
npm install
```

公众号 AppID、AppSecret 和其他 API 密钥只通过环境变量配置，不得写入仓库。

## 已实现

- RSS/官方栏目候选收集、近 3 个自然日过滤、重复链接/同题历史排除；
- 分层来源目录覆盖国内政府、国际机构、科研机构与专业媒体；反爬站点通过检索入口发现后回到原文核验；
- 新能源与电力、建筑、工业、交通运输、农业、数字化、新材料、负碳、水资源、环保与循环经济十大领域每日全部扫描，空领域记录 0 条；
- 每次采集生成来源健康报告，记录正常、空结果、失败来源及领域覆盖；
- 绿色技术领域分类与可解释评分，传播热度只标为人工判断项；
- 来源按“官方一手、机构研究、专业媒体、商业发布”分级，自动选题默认每个来源最多 2 条；
- 评分后自动选出 3–5 条，强制检查中国相关动态与领域多样性；
- 可在微信浏览器打开的手机编辑台：只在需要替换、取消或改封面时使用；
- 候选新闻显示可直接打开与复制的原始数据源网址；
- 每次出图后自动存档候选与入选结果，并生成近 7 天、近 30 天回顾及后续验证判断；
- 按每条新闻内容生成不同的 AI 写实背景，再叠加固定品牌排版，输出 1080×1350 封面与新闻卡；
- 封面采用“左侧标题、右侧新闻实景、底部四组数据”的 PTA 视觉构图，只局部暗化文字区，不用全屏重色蒙版遮盖新闻图片；
- 公众号正文采用“连续图片卡 + 简讯 + 可点击原文网址 + 2026绿焰气候创新奖活动尾注”；
- 客户补充 AppID/AppSecret 后，上传封面与正文图片并创建公众号草稿。

## 首次运行

```bash
cd green-daily
npm install
npm run seed       # 仅生成明确标注为“演示数据”的候选，便于验收
npm run auto-select
npm run render
```

手机与电脑在同一网络时，用手机微信打开终端显示的局域网地址（例如 `http://电脑局域网IP:8787`）。部署到有 HTTPS 的服务器后，可把这个地址放进公众号菜单或微信收藏。

正式运行时只需 `npm run run`：它会扫描近 3 个自然日、评分、自动选出 3–5 条，并生成日报图片。每期至少 1 条中国相关和 1 条国际动态。产物位于 `exports/YYYY-MM-DD/`。

查看趋势回顾：

```bash
npm run review-week
npm run review-month
```

回顾会输出领域分布、重要新闻、数据源网址和“对之后的判断”。判断附带验证指标；历史存档不足时会明确标为低可信度。

## 正式采集

1. 在 `config/sources.json` 填入客户确认过的 RSS 或网页采集来源；在 `config/domain-search-plan.json` 维护十大领域的中英文检索式。中国政府、国际组织和科研机构优先；只有具备明确使用授权的来源才可以抓取全文。
   官网阻止普通自动请求的来源保留在目录中，并标为 `search_or_authorized_api`，不伪装成采集成功。
2. 运行：

```bash
npm run run
```

3. 系统按来源权威、技术/工程实质、新鲜度、中国相关性、领域覆盖与信息完整度自动评分。它不会虚构“阅读量/传播量”；没有可靠传播信号时，该项不加分。

## 公众号贴图草稿

客户提供公众号 API 后，在服务器安全配置环境变量（参考 `.env.example`），并确保服务器出口 IP 已加入公众号白名单：

```bash
export WECHAT_APPID='客户自己的 AppID'
export WECHAT_APPSECRET='客户自己的 AppSecret'
export WECHAT_PUBLISH_MODE='draft_only'
node scripts/wechat-draft.mjs
```

该命令默认创建 `newspic` 图片消息，因此会进入公众号后台的“贴图”草稿，而不是“文章”草稿。图片下方文字会列出新闻摘要、原文网址和活动信息；贴图不是 HTML 文章，网址在部分微信端可能只显示为文本。

如客户明确接受无人值守发布，可把 `WECHAT_PUBLISH_MODE` 改为 `auto_submit`。脚本会在创建贴图草稿后调用发布接口。这个动作是“发布”而不是“群发给全部粉丝”，仍会经过微信平台审核，提交成功不等于立即可见。默认保持 `draft_only`。

## 工作日定时任务

在服务器上配置工作日 06:30 自动收集、评分与出图；07:40 创建草稿：

```cron
30 6 * * 1-5 cd /path/to/green-daily && npm run run
```

“08:00 发送”建议由定时任务在 08:00 运行 `auto_submit`，并以客户公众号的接口权限和微信审核结果为准；不要把创建草稿或提交审核误当成已群发给粉丝。

## 周一周末汇总

独立 Skill 位于 `skills/monday-green-tech-weekend-roundup/`。它只覆盖刚过去的周六和周日，沿用十大领域扫描、历史去重、国际动态最低数量、新闻专属配图和公众号图片卡规则。用户选择自动化时间之前，该 Skill 不自行创建定时任务。

## 需要客户确认的事项

- 最终来源清单与全文/图片使用授权；
- 中国相关条目的优先级与是否强制每天出现；
- 公众号认证与 API 权限、服务器出口 IP 白名单；
- 公众号、小红书、B 站分别由谁在最终发布前确认；
- 视觉品牌：名称、Logo、主色、固定结尾和话题标签策略。
