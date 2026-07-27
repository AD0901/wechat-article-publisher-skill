---
name: weekday-green-tech-daily
description: Collect, verify, deduplicate, score, illustrate, render, and prepare the Tuesday-to-Friday PTA Green Tech Daily WeChat image-card draft from the latest 72 hours of global green-technology news. Use when the user asks for 工作日绿色技术日报、周二至周五绿色新闻、近三日绿色科技新闻、PTA Green Tech Daily、自动生成绿色技术公众号图片日报，or wants a weekday automation that scans all ten green-tech domains and creates a WeChat draft.
---

# PTA 周二至周五绿色技术日报

在周二至周五扫描最近 72 小时的全球绿色技术新闻，自动选择 3–5 条，生成内容相关且互不重复的图片卡和公众号“贴图”草稿。默认只创建贴图草稿，禁止直接群发。

## 执行顺序

1. 将本 Skill 所在目录的 `../..` 解析为项目根目录，并在该目录工作。不要依赖某台电脑的绝对路径。
2. 完整读取：
   - `references/editorial-policy.md`
   - `references/source-plan.md`
   - `references/visual-style.md`
   - 项目 `config/green-daily.json`
   - 项目 `config/domain-search-plan.json`
3. 检查 Node.js、项目依赖、网页检索能力、图片生成能力和公众号环境变量。不得输出或提交密钥。
4. 运行 `npm run collect`。读取 `runtime/collect-report.json`，对全部 `search_required` 来源和空缺领域继续运行中文、英文检索。
5. 逐一扫描十大领域。记录每个领域的检索式、候选数、可核验数、入选数和失败来源；无合格新闻时记录 0，不得省略。
6. 只保留运行时刻向前 72 小时内的新闻。将时间统一换算为 `Asia/Shanghai`；日期不可核验的新闻不得入选。
7. 优先打开一级来源。搜索结果和专业媒体可用于发现线索，但尽量回到政府、国际组织、研究机构、论文或企业技术发布页核验。
8. 读取 `runtime/history.json` 和最近的 `exports/*/manifest.json`，按规范化 URL、标题、主体、事件和关键数据去重。不得重复周一周末汇总已采用的新闻。
9. 保存可核验候选，执行评分与自动选题。最终选择 3–5 条：
   - 至少 1 条中国相关动态；
   - 至少 1 条国际动态；
   - 同一来源最多 2 条；
   - 优先工程验证、投运、示范、规模化、效率突破和公开数据；
   - 不用低质量内容凑领域数量。
10. 为每条入选新闻生成独立 `visualPrompt`。能调用图片生成工具时生成无文字、无 Logo、无水印的写实背景，并写入 `visualImage`；不能生图时使用不同的领域化备用背景并标记 `imageMode=fallback`。
11. 运行 `npm run prepare`、`npm run auto-select` 和 `npm run render`；如果候选由检索工具补充，先按项目数据结构写入 `runtime/articles.json`。
12. 检查导出的图片、HTML 和 `manifest.json`。有视觉模型时查看全部图片；没有视觉模型时检查尺寸、文件大小、哈希重复、文字行数、溢出和文件可打开性，不得声称完成视觉审美检查。
13. 只有全部硬性校验通过且 `WECHAT_APPID`、`WECHAT_APPSECRET` 已安全配置时，运行 `node scripts/wechat-draft.mjs`，用 `article_type=newspic` 创建公众号“贴图”草稿。默认 `WECHAT_PUBLISH_MODE=draft_only`。
14. 只有用户或客户明确启用无人值守发布时，才允许使用 `WECHAT_PUBLISH_MODE=auto_submit`；这只提交微信“发布”审核，不是群发给全部粉丝。草稿创建成功后才更新发布历史，不要把“创建草稿”或“提交审核”表述成“已发布”。

## 候选结构

每条候选至少保留：

```json
{
  "title": "原文标题",
  "editorTitle": "中文图片卡标题",
  "source": "来源机构",
  "url": "可直接打开的原文链接",
  "publishedAt": "带时区的发布时间",
  "domain": ["领域 ID"],
  "chinaRelated": false,
  "summary": "经原文核验的新闻事实",
  "whyImportant": "意义、突破或约束变化",
  "evidence": "关键证据",
  "dataTiles": [{"value": "数值", "label": "含义"}],
  "visualPrompt": "新闻专属写实背景提示词",
  "visualImage": "项目内相对路径"
}
```

数字、机构、时间、政策名称和因果关系必须能回到原文。不得编造阅读量、传播量或行业结论。

## 失败处理

遇到以下任一条件时停止创建草稿，但仍保存候选报告和失败原因：

- 合格候选少于 3 条；
- 没有中国相关动态；
- 没有国际动态；
- 任一入选新闻缺少可打开的原文 URL；
- 新闻日期无法核验；
- 背景图完全重复；
- 图片或 HTML 校验失败。

外网不可访问时按照 `references/source-plan.md` 降级。不得把网络失败写成“国际扫描完成”，也不得使用绕过登录、验证码、付费墙或网站访问控制的方法。

## 产物

将产物保存到 `exports/YYYY-MM-DD/`：

- `01-cover.jpg`
- `02-news-card.jpg` 起的 3–5 张新闻卡
- `wechat-cover.jpg`
- `wechat-article.html`
- `wechat-upload.html`
- `manifest.json`
- 可选的 `wechat-draft-result.json`（`draftType` 必须为 `newspic`）

最终报告仅列出时间窗口、十大领域扫描表、入选新闻及可点击原文、国际来源缺口、图片模式、产物路径和公众号草稿状态。
