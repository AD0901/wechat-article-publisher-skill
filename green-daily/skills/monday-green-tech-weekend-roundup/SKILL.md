---
name: monday-green-tech-weekend-roundup
description: Collect, verify, deduplicate, score, illustrate, and prepare the Monday PTA Green Tech Daily roundup for news published on the immediately preceding Saturday and Sunday. Use when the user asks for 周一绿色技术周末汇总、周六日绿色新闻、周末绿色科技日报、Monday green-tech roundup, or wants a Monday automation that turns weekend global green-technology news into image cards and a WeChat draft.
---

# PTA 周一绿色技术周末汇总

生成一份只覆盖刚过去周六、周日的 `PTA Green Tech Daily`。扫描十大领域的中外一级来源，自动选择 3–5 条，按新闻内容生成不同背景图与图片卡片，最后生成公众号草稿；不要直接群发。

## 执行顺序

1. 将本 Skill 所在目录的 `../..` 解析为项目根目录，并在该目录运行 `node skills/monday-green-tech-weekend-roundup/scripts/weekend-window.mjs`，取得北京时间周六 00:00 至周一 00:00 的窗口。不要依赖某台电脑的绝对路径。
2. 完整读取：
   - `references/editorial-policy.md`
   - `references/source-plan.md`
   - `references/visual-style.md`
   - 项目 `config/domain-search-plan.json`
3. 检查 Node.js、项目依赖、网页检索能力、图片生成能力和公众号环境变量。不得输出或提交密钥。
4. 对十大领域逐一运行中文与英文检索。优先打开原始机构页面；媒体报道仅作为线索，不能替代可获得的一级来源。
5. 将候选限制在脚本返回的周六、周日窗口。网页只有“最近发布”而无可核验日期时，不要自动入选。
6. 读取项目 `runtime/history.json` 和最近的 `exports/*/manifest.json`，按规范化 URL 和同题标题去重。不得重复使用前几日已进入公众号草稿的新闻。
7. 为候选保留原文 URL、来源、发布时间、新闻事实、可核验数字、`whyImportant`、所属领域和中外属性。
8. 自动评分并选择 3–5 条：
   - 至少 1 条中国相关；
   - 至少 1 条国际动态；
   - 优先工程验证、投运、示范、规模化、效率突破和公开数据；
   - 同一来源最多 2 条；
   - 领域多样性只作为加分项，不用低质量新闻凑齐十个领域。
9. 对未出现合格新闻的领域记录 `0`，不得省略领域，也不得跨领域凑数。
10. 使用项目现有图片日报生成器。每条新闻给出不同的 `visualPrompt`，生成无文字、无水印的写实背景，再叠加确定性中文排版。不能生图时使用不同的领域化备用背景并标记 `imageMode=fallback`。
11. 按 `references/visual-style.md` 检查封面和内页。无视觉模型时检查尺寸、文件大小、哈希、文字行数和溢出，不得声称完成视觉审美检查。
12. 公众号正文先连续放封面与新闻图片卡，再列每条简讯和可点击原文 URL，最后保留“2026绿焰气候创新奖”活动模块。
13. 只有硬性校验通过且公众号环境变量存在时才创建草稿。创建公众号草稿后才把入选 URL 写入 `runtime/history.json`。禁止直接群发，不要把“创建草稿”描述成“已经定时群发”。

## 内容约束

- 不写“编辑判断”。
- 使用“为什么重要”，说明意义、突破或部署障碍；不要换一种说法复述新闻。
- 把推断写成待验证条件，不能制造确定结论。
- 图片是视觉表达，不是事实证据；事实必须来自原文。
- 背景图片保持接近原始亮度；不得使用重色全屏蒙版遮盖新闻场景。
- 原文链接已列出时，不再写“前后相关”“来源说明”或重复的方法论段落。
- 新闻发布时间按 `Asia/Shanghai` 统一判断。

## 失败条件

遇到以下任一情况时停止自动出稿，并报告缺口：

- 合格候选少于 3 条；
- 没有中国相关动态；
- 没有国际动态；
- 任一入选新闻缺少可打开的原文 URL；
- 周末日期无法核验；
- AI 配图仍重复使用同一张背景。

## 产物

将产物保存到项目 `exports/YYYY-MM-DD/`：

- `01-cover.jpg`
- `02-news-card.jpg` 起的新闻图片卡
- `wechat-cover.jpg`
- `wechat-article.html`
- `manifest.json`
- 可选的 `wechat-draft-result.json`

自动化时间由用户另行选择；本 Skill 不自行创建或修改定时任务。
