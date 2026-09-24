import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { loadState, selectedArticles, settings, tagsFor, todayInShanghai, writeJson } from "./daily.mjs";
import { archiveState } from "./review.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const EXPORTS = path.join(ROOT, "exports");
const WIDTH = 1080;
const HEIGHT = 1350;
const DOMAIN_LABELS = {
  energy_power: "ENERGY SHIFT / 能源转型",
  building: "GREEN BUILDING / 绿色建筑",
  industry: "INDUSTRY / 工业减碳",
  transport: "MOBILITY / 绿色交通",
  agriculture: "AGRICULTURE / 绿色农业",
  digital: "DIGITAL / 绿色数字化",
  materials: "MATERIALS / 新材料",
  negative_emissions: "CARBON REMOVAL / 负碳技术",
  water: "WATER / 水资源管理",
  circular_economy: "CIRCULARITY / 循环经济"
};

function escapeXml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrap(text, maximum = 18, lines = 4) {
  const clean = String(text || "").replace(/\s+/g, "").trim();
  const result = [];
  for (let index = 0; index < clean.length && result.length < lines; index += maximum) result.push(clean.slice(index, index + maximum));
  if (clean.length > maximum * lines && result.length) result[result.length - 1] = `${result[result.length - 1].slice(0, -1)}…`;
  return result;
}

function wrapBalanced(text, maximum = 18, lines = 4) {
  const clean = String(text || "").replace(/\s+/g, "").trim();
  if (!clean) return [];
  const visible = clean.length > maximum * lines ? `${clean.slice(0, maximum * lines - 1)}…` : clean;
  const lineCount = Math.min(lines, Math.max(1, Math.ceil(visible.length / maximum)));
  const result = [];
  let cursor = 0;
  const isAsciiWord = (character = "") => /[A-Za-z0-9]/.test(character);
  while (cursor < visible.length && result.length < lineCount) {
    const remainingLines = lineCount - result.length;
    if (remainingLines === 1) {
      result.push(visible.slice(cursor));
      break;
    }
    const remaining = visible.length - cursor;
    const target = Math.min(maximum, Math.ceil(remaining / remainingLines));
    let boundary = cursor + target;
    if (isAsciiWord(visible[boundary - 1]) && isAsciiWord(visible[boundary])) {
      let backward = boundary;
      while (backward > cursor && isAsciiWord(visible[backward - 1])) backward -= 1;
      let forward = boundary;
      while (forward < visible.length && isAsciiWord(visible[forward])) forward += 1;
      const remainingAfterBackward = visible.length - backward;
      boundary = remainingAfterBackward <= maximum * (remainingLines - 1) ? backward : Math.min(cursor + maximum, forward);
    }
    result.push(visible.slice(cursor, boundary));
    cursor = boundary;
  }
  return result.filter(Boolean);
}

function textLines(lines, x, y, size, weight = 500, color = "#F8F6EE", gap = 1.28, anchor = "start") {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * size * gap}" text-anchor="${anchor}" fill="${color}" font-family="PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`).join("");
}

function dateLabel(date) {
  const parsed = new Date(`${date}T12:00:00+08:00`);
  const weekday = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", weekday: "long" }).format(parsed);
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日 ${weekday}`;
}

function tilesFor(article) {
  if (Array.isArray(article.dataTiles) && article.dataTiles.length) return article.dataTiles.slice(0, 4);
  const values = String(article.keyData || article.evidence || "").split(/[；;]/).filter(Boolean).slice(0, 4);
  return values.map((value, index) => ({ value: value.slice(0, 12), label: `关键数据 ${index + 1}` }));
}

function tileSvg(tiles, y, cover = false) {
  return Array.from({ length: 4 }, (_, index) => {
    const tile = tiles[index] || { value: "—", label: "本期未披露" };
    const x = 72 + index * 238;
    const valueSize = String(tile.value).length > 8 ? 29 : 40;
    return `<g>
      ${index ? `<line x1="${x - 18}" y1="${y - 20}" x2="${x - 18}" y2="${y + 148}" stroke="#A8D535" stroke-opacity=".42"/>` : ""}
      <text x="${x + 92}" y="${y + 42}" text-anchor="middle" fill="#A8D535" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="${valueSize}" font-weight="800">${escapeXml(tile.value)}</text>
      ${textLines(wrap(tile.label, cover ? 7 : 8, 2), x + 92, y + 88, 23, 500, "#EDF5EE", 1.32, "middle")}
    </g>`;
  }).join("");
}

function patternDefs() {
  return `<defs>
    <linearGradient id="coverShade" x1="0" x2="1" y1="0" y2="0">
      <stop stop-color="#001A17" stop-opacity=".84"/>
      <stop offset=".38" stop-color="#001A17" stop-opacity=".62"/>
      <stop offset=".68" stop-color="#001A17" stop-opacity=".12"/>
      <stop offset="1" stop-color="#001A17" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" x2="0" y1="0" y2="1">
      <stop stop-color="#001A17" stop-opacity="0"/>
      <stop offset=".58" stop-color="#001A17" stop-opacity=".06"/>
      <stop offset=".74" stop-color="#001A17" stop-opacity=".72"/>
      <stop offset="1" stop-color="#00120F" stop-opacity=".97"/>
    </linearGradient>
    <radialGradient id="vignette" cx="64%" cy="42%" r="78%">
      <stop offset=".58" stop-color="#001A17" stop-opacity="0"/>
      <stop offset="1" stop-color="#001A17" stop-opacity=".28"/>
    </radialGradient>
    <pattern id="lines" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <line x1="0" y1="0" x2="0" y2="30" stroke="#C5E7D3" stroke-opacity=".025" stroke-width="2"/>
    </pattern>
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#001713" flood-opacity=".78"/>
    </filter>
  </defs>`;
}

function coverOverlaySvg({ article, date }) {
  const title = wrapBalanced(article.editorTitle || article.title, 10, 4);
  const tiles = tilesFor(article);
  const focus = tiles[0] || { value: "今日", label: "封面热点" };
  return Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${patternDefs()}
    <rect width="100%" height="100%" fill="url(#coverShade)"/>
    <rect width="100%" height="100%" fill="url(#bottom)"/>
    <rect width="100%" height="100%" fill="url(#vignette)"/>
    <rect width="100%" height="100%" fill="url(#lines)" opacity=".5"/>
    <rect x="58" y="42" width="590" height="55" rx="28" fill="#0B302A" fill-opacity=".54" stroke="#B7D8C4" stroke-opacity=".7"/>
    <circle cx="90" cy="69" r="17" fill="#A8D535"/><path d="M80 70c8-14 21-12 23-4-8 0-13 3-17 10" fill="none" stroke="#083229" stroke-width="4" stroke-linecap="round"/>
    <text x="120" y="79" fill="#F4F7F1" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="26" font-weight="600">PTA Green Tech Daily · ${escapeXml(dateLabel(date))}</text>
    <text x="70" y="140" fill="#FFFFFF" font-family="Arial" font-size="24">VIDEO COVER / <tspan fill="#A8D535">今日封面热点</tspan></text>
    <text x="950" y="94" text-anchor="end" fill="#FFFFFF" font-family="Arial" font-size="72" font-weight="800">PTA</text>
    <text x="950" y="128" text-anchor="end" fill="#E0E9E4" font-family="Arial" font-size="20">GREEN TECH DAILY</text>
    <text x="948" y="232" text-anchor="end" fill="#FFFFFF" font-family="Arial" font-size="78" font-weight="500">01</text>
    <g filter="url(#textShadow)">${textLines(title, 68, 300, 82, 900, "#FFFFFF", 1.18)}</g>
    <rect x="68" y="694" width="750" height="68" rx="34" fill="#001C18" fill-opacity=".58" stroke="#A8D535"/>
    <circle cx="108" cy="728" r="17" fill="#A8D535" fill-opacity=".18" stroke="#A8D535" stroke-width="3"/>
    <text x="140" y="739" fill="#A8D535" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="26" font-weight="700">重点</text>
    <text x="220" y="739" fill="#FFFFFF" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="26">${escapeXml(`${focus.value} ${focus.label}`)}</text>
    <rect x="54" y="966" width="972" height="234" rx="24" fill="#001713" fill-opacity=".46"/>
    ${tileSvg(tiles, 1012, true)}
    <line x1="62" y1="1244" x2="1018" y2="1244" stroke="#A8D535" stroke-opacity=".55"/>
    <text x="62" y="1296" fill="#E7EFEA" font-family="Arial" font-size="23">PTA Green Tech Daily</text>
    <text x="1018" y="1296" text-anchor="end" fill="#A8D535" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="23">把预见变成行动</text>
  </svg>`);
}

function detailOverlaySvg({ article, date, index }) {
  const title = wrapBalanced(article.editorTitle || article.title, 17, 3);
  const fact = wrap(article.summary, 25, 5);
  const why = wrap(article.whyImportant || article.insight || "该条目呈现了可核验的技术或工程进展。", 25, 6);
  const tiles = tilesFor(article);
  const focus = tiles[0] || { value: "—", label: "关键数据" };
  const source = `${article.source}｜${String(article.publishedAt).slice(0, 10)}｜${article.url}`;
  return Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${patternDefs()}
    <rect width="100%" height="100%" fill="url(#coverShade)"/>
    <rect width="100%" height="100%" fill="url(#bottom)" opacity=".42"/>
    <rect width="100%" height="100%" fill="url(#vignette)" opacity=".62"/>
    <rect width="100%" height="100%" fill="url(#lines)" opacity=".45"/>
    <rect x="58" y="38" width="575" height="52" rx="26" fill="#174A35" fill-opacity=".54" stroke="#B7D8C4" stroke-opacity=".34"/>
    <text x="84" y="72" fill="#DDF1CB" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="24">PTA Green Tech Daily · ${escapeXml(dateLabel(date))}</text>
    <text x="976" y="116" text-anchor="end" fill="#FFFFFF" font-family="Arial" font-size="76" font-weight="500">${String(index).padStart(2, "0")}</text>
    <text x="72" y="150" fill="#A8D535" font-family="Arial, PingFang SC, Microsoft YaHei" font-size="24">${escapeXml(DOMAIN_LABELS[article.domain?.[0]] || "GREEN TECHNOLOGY / 绿色技术")}</text>
    <g filter="url(#textShadow)">${textLines(title, 72, 220, 52, 600, "#FFFFFF", 1.2)}</g>
    <rect x="72" y="370" width="936" height="58" rx="22" fill="#001D1A" fill-opacity=".68" stroke="#8ABF68" stroke-opacity=".5"/>
    <text x="98" y="407" fill="#A8D535" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="23" font-weight="700">重点</text>
    <text x="170" y="407" fill="#FFFFFF" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="23">${escapeXml(`${focus.value} ${focus.label}`)}</text>
    <rect x="72" y="454" width="936" height="232" rx="28" fill="#001D28" fill-opacity=".72" stroke="#C1E3D1" stroke-opacity=".3"/>
    <text x="98" y="500" fill="#A8D535" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="23" font-weight="700">新闻事实</text>
    ${textLines(fact, 98, 542, 27, 500, "#F5F8F5", 1.28)}
    <rect x="72" y="710" width="936" height="250" rx="28" fill="#001D28" fill-opacity=".72" stroke="#C1E3D1" stroke-opacity=".3"/>
    <text x="98" y="756" fill="#A8D535" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="23" font-weight="700">为什么重要</text>
    ${textLines(why, 98, 804, 26, 500, "#F5F8F5", 1.25)}
    <rect x="72" y="990" width="936" height="198" rx="24" fill="#001D28" fill-opacity=".64"/>
    ${tileSvg(tiles, 1008)}
    <line x1="72" y1="1224" x2="1008" y2="1224" stroke="#DCEBE1" stroke-opacity=".8"/>
    ${textLines(wrap(source, 58, 2), 72, 1262, 17, 500, "#E9F2ED", 1.3)}
  </svg>`);
}

function fallbackBackgroundSvg(article) {
  const palette = article.domain?.includes("water")
    ? ["#052F43", "#13728A", "#B7E353"]
    : article.domain?.includes("industry")
      ? ["#102B2F", "#4D5551", "#A8D535"]
      : ["#032D26", "#1D6757", "#BDEB4A"];
  return Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="fallback" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".65" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#fallback)"/>
    <circle cx="900" cy="260" r="290" fill="#FFFFFF" opacity=".12"/>
    <path d="M0 1130 C230 920 580 1160 1080 810 L1080 1350 L0 1350Z" fill="#001814" opacity=".52"/>
  </svg>`);
}

async function visualBuffer(article, width = WIDTH, height = HEIGHT) {
  const candidate = article.visualImage ? path.resolve(ROOT, article.visualImage) : "";
  try {
    if (candidate) {
      await fs.access(candidate);
      return await sharp(candidate).resize(width, height, { fit: "cover", position: "centre" }).modulate({ brightness: 0.98, saturation: 0.98 }).png().toBuffer();
    }
  } catch {
    // The deterministic fallback keeps the pipeline usable if an AI image is unavailable.
  }
  return sharp(fallbackBackgroundSvg(article)).resize(width, height).png().toBuffer();
}

async function renderCard(article, overlay, target) {
  const background = await visualBuffer(article);
  await sharp(background).composite([{ input: overlay }]).jpeg({ quality: 84, progressive: true, chromaSubsampling: "4:4:4" }).toFile(target);
}

async function renderWechatCover(article, date, target) {
  const background = await visualBuffer(article, 900, 383);
  const lines = wrapBalanced(article.editorTitle || article.title, 13, 2);
  const overlay = Buffer.from(`<svg width="900" height="383" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wc" x1="0" x2="1"><stop stop-color="#001D18" stop-opacity=".82"/><stop offset=".58" stop-color="#001D18" stop-opacity=".35"/><stop offset="1" stop-color="#001D18" stop-opacity="0"/></linearGradient>
      <filter id="wcShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#001713" flood-opacity=".8"/></filter>
    </defs>
    <rect width="900" height="383" fill="url(#wc)"/>
    <text x="44" y="54" fill="#A8D535" font-family="Arial" font-size="21" font-weight="700">PTA GREEN TECH DAILY · ${escapeXml(date)}</text>
    <g filter="url(#wcShadow)">${textLines(lines, 44, 158, 53, 800, "#FFFFFF", 1.22)}</g>
    <text x="44" y="338" fill="#E6EFE9" font-family="PingFang SC, Microsoft YaHei, Arial" font-size="22">全球绿色技术进展｜原文可追溯</text>
  </svg>`);
  await sharp(background).composite([{ input: overlay }]).jpeg({ quality: 80, progressive: true }).toFile(target);
}

function articleHtml({ date, dateTitle, articles, imageCount, tags, activity }) {
  const images = Array.from({ length: imageCount }, (_, index) =>
    `<p style="margin:0 0 14px;text-align:center;"><img src="{{CARD_${index + 1}}}" style="display:block;width:100%;height:auto;margin:0 auto;" /></p>`
  ).join("\n");
  const news = articles.map((article) => `<p style="font-size:16px;line-height:1.9;margin:0 0 26px;color:#222;">
    <strong>${escapeHtml(article.editorTitle || article.title)}</strong><br/>
    ${escapeHtml(article.summary)}<br/>
    <span style="font-size:13px;color:#68736c;">原文：</span><a href="${escapeHtml(article.url)}" style="font-size:13px;color:#356b54;text-decoration:underline;word-break:break-all;">${escapeHtml(article.url)}</a>
  </p>`).join("\n");
  const activityBlock = activity ? `<section style="margin:36px 0 12px;padding:20px 18px;background:#F2F7EA;border-left:5px solid #83B735;">
    <p style="margin:0 0 10px;font-size:18px;line-height:1.6;"><strong>${escapeHtml(activity.title)}</strong>正式启动征集</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.85;color:#334238;">${escapeHtml(activity.body.replace(`${activity.title}正式启动征集。`, ""))}</p>
    <p style="margin:0;"><a href="${escapeHtml(activity.url)}" style="color:#356b54;text-decoration:underline;">点击查看活动详情并申报</a></p>
  </section>` : "";
  return `<section id="wenyan" style="max-width:677px;margin:0 auto;color:#23352e;font-family:PingFang SC,Microsoft YaHei,Arial;line-height:1.8;">
  <p style="font-size:14px;color:#68736c;margin:0 0 8px;">PTA Green Tech Daily</p>
  <h1 style="font-size:27px;line-height:1.35;color:#123f33;margin:0 0 20px;">${escapeHtml(dateTitle)}</h1>
  ${images}
  <p style="font-size:14px;color:#68736c;margin:30px 0 20px;">以下为本期新闻简讯，点击原文链接可直接核验数据。</p>
  ${news}
  ${activityBlock}
  <p style="font-size:13px;color:#5a7566;margin:26px 0 0;">${tags.map((tag) => `#${escapeHtml(tag)}`).join(" ")}</p>
  <p style="font-size:12px;color:#8a958f;line-height:1.7;">新闻窗口：过去 3 个自然日；同一链接与同题新闻不重复发布。图片为 AI 辅助生成的视觉表达，不作为新闻事实证据。</p>
</section>`;
}

export async function renderSelected() {
  const state = await loadState();
  if (!state) throw new Error("没有可渲染的日报。先准备候选新闻。");
  const articles = selectedArticles(state);
  if (articles.length < 3) throw new Error("至少选择 3 条新闻后才能生成日报。");
  if (!articles.some((article) => article.chinaRelated)) throw new Error("每期至少包含 1 条中国相关动态；请补选或标注一条。");
  if (!articles.some((article) => !article.chinaRelated)) throw new Error("每期至少包含 1 条国际动态；请先补充国际检索结果。");
  const config = await settings();
  const cover = articles.find((article) => article.id === state.coverId) || articles[0];
  const date = todayInShanghai();
  const output = path.join(EXPORTS, date);
  await fs.mkdir(output, { recursive: true });
  const dateTitle = `🌍 PTA Green Tech Daily · ${dateLabel(date)}`;
  const files = [];
  const coverPath = path.join(output, "01-cover.jpg");
  await renderCard(cover, coverOverlaySvg({ article: cover, date }), coverPath);
  files.push(coverPath);
  const wechatCoverPath = path.join(output, "wechat-cover.jpg");
  await renderWechatCover(cover, date, wechatCoverPath);
  for (const [index, article] of articles.entries()) {
    const target = path.join(output, `${String(index + 2).padStart(2, "0")}-news-card.jpg`);
    await renderCard(article, detailOverlaySvg({ article, date, index: index + 1 }), target);
    files.push(target);
  }
  const tags = tagsFor(articles);
  const uploadHtml = articleHtml({
    date,
    dateTitle,
    articles,
    imageCount: files.length,
    tags,
    activity: config.activity
  });
  const htmlPath = path.join(output, "wechat-upload.html");
  const previewHtmlPath = path.join(output, "wechat-article.html");
  let previewHtml = uploadHtml;
  files.forEach((file, index) => {
    previewHtml = previewHtml.replaceAll(`{{CARD_${index + 1}}}`, path.basename(file));
  });
  await Promise.all([
    fs.writeFile(htmlPath, uploadHtml, "utf8"),
    fs.writeFile(previewHtmlPath, previewHtml, "utf8")
  ]);
  const xhsCaption = `${dateTitle}\n\n${articles.map((article, index) => `${index + 1}. ${article.editorTitle || article.title}\n${article.summary}\n原文：${article.url}`).join("\n\n")}\n\n${config.activity?.title || ""}\n${config.activity?.url || ""}\n\n${tags.map((tag) => `#${tag}`).join(" ")}`;
  const bilibiliScript = `【PTA Green Tech Daily】今天用 60 秒看 ${articles.length} 条绿色技术新进展。\n\n${articles.map((article, index) => `${index + 1}. ${article.editorTitle || article.title}。${article.summary}`).join("\n")}\n\n完整来源见公众号原文链接。`;
  await Promise.all([
    fs.writeFile(path.join(output, "xiaohongshu-caption.txt"), xhsCaption, "utf8"),
    fs.writeFile(path.join(output, "bilibili-script.txt"), bilibiliScript, "utf8")
  ]);
  const manifest = {
    date,
    dateTitle,
    brandName: "PTA Green Tech Daily",
    coverId: cover.id,
    selected: articles,
    files,
    bodyFiles: files,
    wechatCoverPath,
    htmlPath,
    previewHtmlPath,
    tags,
    activity: config.activity,
    scanCoverage: state.collectionReport?.domainScanPlan || null,
    status: "rendered"
  };
  await writeJson(path.join(output, "manifest.json"), manifest);
  await archiveState(state);
  return manifest;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  renderSelected().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error.stack);
    process.exit(1);
  });
}
