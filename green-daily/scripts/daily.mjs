import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RUNTIME = path.join(ROOT, "runtime");
const CONFIG = path.join(ROOT, "config");
const DATA = path.join(ROOT, "data");
const EXPORTS = path.join(ROOT, "exports");

const DOMAIN_KEYWORDS = {
  energy_power: ["能源", "电力", "电网", "储能", "风电", "光伏", "太阳能", "氢能", "renewable", "battery", "storage", "grid", "solar", "wind", "hydrogen"],
  building: ["建筑", "建材", "楼宇", "节能", "building", "construction", "cement"],
  industry: ["工业", "钢铁", "水泥", "化工", "制造", "industry", "steel", "manufactur"],
  transport: ["交通", "汽车", "充电", "物流", "船舶", "aviation", "vehicle", "transport", "charging", "mobility"],
  agriculture: ["农业", "农田", "肥料", "甲烷", "agriculture", "farm", "fertilizer", "methane"],
  digital: ["人工智能", "数据中心", "数字", "物联网", "AI", "data center", "digital", "software"],
  materials: ["材料", "矿产", "电池材料", "生物基", "material", "mineral", "recycling"],
  negative_emissions: ["碳捕集", "CCUS", "碳汇", "负碳", "carbon capture", "removal"],
  water: ["水资源", "海水淡化", "水务", "灌溉", "water", "desalination", "irrigation"],
  circular_economy: ["循环", "回收", "废弃物", "资源化", "circular", "waste", "reuse"]
};

const TOPIC_TAGS = {
  energy_power: "新能源", building: "绿色建筑", industry: "绿色工业", transport: "绿色交通",
  agriculture: "绿色农业", digital: "绿色数字化", materials: "新材料", negative_emissions: "负碳技术",
  water: "水资源管理", circular_economy: "循环经济"
};

export async function ensureDirectories() {
  await Promise.all([RUNTIME, EXPORTS].map((directory) => fs.mkdir(directory, { recursive: true })));
}

export async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function todayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

export async function settings() {
  return readJson(path.join(CONFIG, "green-daily.json"), {});
}

function clean(value = "") {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function decodeEntities(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
}

function nodeValue(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return decodeEntities(clean(match[1]));
  }
  return "";
}

function nodeLink(block) {
  const atom = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return atom?.[1] || nodeValue(block, ["link", "guid"]);
}

function classify(text) {
  const normalized = text.toLowerCase();
  return Object.entries(DOMAIN_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => keyword === "AI" ? /\bAI\b/i.test(text) : normalized.includes(keyword.toLowerCase())))
    .map(([domain]) => domain);
}

function hasTechnologyEvidence(article) {
  return /试点|投运|并网|验证|效率|示范|量产|专利|工程|项目|装机|技术|产品|设备|系统|改造|回收|储能|风能|氢能|微电网|虚拟电厂|算电协同|充电|绿电|deploy|pilot|commission|demonstrat|efficien|commercial|project|technology|facility|installation/i.test(`${article.title} ${article.summary}`);
}

function isGreenRelevant(article) {
  const pattern = /绿色|低碳|零碳|可持续|减排|降碳|节能|能效|清洁生产|新能源|可再生|电网|储能|风电|光伏|太阳能|氢能|绿电|充电|电动汽车|车网互动|循环经济|回收|废弃物|资源化|碳捕集|碳移除|碳汇|蓝碳|生态修复|碳市场|CCUS|水处理|污水|海水淡化|节水|灌溉|绿色建筑|绿色建材|甲烷|环保|clean energy|renewable|battery|energy storage|power grid|solar|wind power|hydrogen|energy efficien|decarbon|emission|carbon market|carbon capture|circular|recycl|waste|water treatment|wastewater|desalin|electric vehicle|heat pump|green building|sustainable material/i;
  return pattern.test(article.title) || pattern.test(article.summary);
}

function isEditorialArticle(article) {
  try {
    const pathname = new URL(article.url).pathname;
    return !/\/(?:index|default)(?:_\d+)?\.html?$/i.test(pathname);
  } catch { return false; }
}

function parseDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString();
}

function feedItems(xml, source) {
  const blocks = [...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map((match) => match[1]);
  return blocks.map((block) => {
    const title = nodeValue(block, ["title"]);
    const summary = nodeValue(block, ["description", "summary", "content"]);
    const url = nodeLink(block);
    const publishedAt = parseDate(nodeValue(block, ["pubDate", "published", "updated", "dc:date"]));
    const domain = [...new Set([...classify(`${title} ${summary}`), ...(source.defaultDomains || [])])];
    return {
      id: crypto.createHash("sha256").update(url || `${source.id}:${title}`).digest("hex").slice(0, 16),
      title,
      summary: summary.slice(0, 650),
      url,
      source: source.name,
      sourceId: source.id,
      sourceTier: source.tier || "professional_media",
      publishedAt,
      domain,
      chinaRelated: /中国|中国企业|China|Chinese/i.test(`${title} ${summary}`),
      authority: Number(source.authority || 5),
      evidence: "来源 RSS 摘要；发布前请打开原文核验数字与结论。"
    };
  }).filter((item) => item.title && item.url && item.domain.length).slice(0, source.maxItems || 20);
}

function absoluteUrl(value, source) {
  try { return new URL(value, source.baseUrl || source.page).href; } catch { return ""; }
}

function dateFromText(value = "") {
  const normalized = decodeEntities(clean(value));
  const match = normalized.match(/(20\d{2})\s*[年/.—-]\s*(\d{1,2})\s*[月/.—-]\s*(\d{1,2})\s*日?/);
  return match ? safeDate(match[1], match[2], match[3]) : "";
}

function dateFromUrl(value = "") {
  const match = value.match(/(?:^|\/)(20\d{2})(\d{2})(\d{2})(?:\/|$)/);
  return match ? safeDate(match[1], match[2], match[3]) : "";
}

function safeDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return "";
  const value = new Date(`${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00+08:00`);
  return Number.isFinite(value.getTime()) ? value.toISOString() : "";
}

function descriptionFromHtml(html = "") {
  const metaPatterns = [
    /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i
  ];
  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    const value = match ? decodeEntities(clean(match[1])) : "";
    if (value.length >= 40) return value.slice(0, 650);
  }
  const paragraphs = [...html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map((match) => decodeEntities(clean(match[1])))
    .filter((value) => value.length >= 35 && !/版权所有|责任编辑|联系我们|ICP备|cookie/i.test(value));
  return paragraphs.slice(0, 3).join(" ").slice(0, 650);
}

async function hydrateHtmlItem(item, source) {
  try {
    const response = await fetch(item.url, {
      headers: { "user-agent": "PTA-Green-Daily/0.2 (editorial research; source links preserved)" },
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const summary = descriptionFromHtml(html) || item.summary;
    const publishedAt = dateFromText(html.slice(0, 100_000)) || item.publishedAt;
    const domain = [...new Set([...classify(`${item.title} ${summary}`), ...(source.defaultDomains || [])])];
    return {
      ...item,
      summary,
      publishedAt,
      domain,
      evidence: summary.length >= 80 ? "已从原始页面提取正文摘要；关键数字仍需发布前复核。" : "已定位原始页面，但正文信息较少，发布前必须人工核验。",
      autoPublishEligible: summary.length >= 80
    };
  } catch (error) {
    return { ...item, autoPublishEligible: false, detailError: error.message };
  }
}

async function htmlItems(html, source, windowDays = 3) {
  const pattern = new RegExp(source.linkPattern);
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const basic = [];
  for (const anchor of anchors) {
    const url = absoluteUrl(anchor[1], source);
    const title = decodeEntities(clean(anchor[2]));
    if (!url || !title || title.length < 6) continue;
    const parsed = new URL(url);
    const sourceHost = new URL(source.page).hostname.replace(/^www\./, "");
    const targetHost = parsed.hostname.replace(/^www\./, "");
    if (targetHost !== sourceHost && !targetHost.endsWith(`.${sourceHost}`)) continue;
    if (!pattern.test(parsed.pathname) || /\/index(?:_\d+)?\.html?$/i.test(parsed.pathname)) continue;
    if (/^(首页|更多|新闻|工作动态|通知公告|政策法规|节能与综合利用司|English)$/i.test(title)) continue;
    const context = html.slice(Math.max(0, anchor.index - 300), Math.min(html.length, anchor.index + anchor[0].length + 500));
    const publishedAt = dateFromText(context) || dateFromUrl(url);
    if (publishedAt && Date.parse(publishedAt) < Date.now() - windowDays * 86_400_000) continue;
    const domain = [...new Set([...classify(title), ...(source.defaultDomains || [])])];
    basic.push({
      id: crypto.createHash("sha256").update(url).digest("hex").slice(0, 16),
      title,
      summary: decodeEntities(clean(context)).slice(0, 360),
      url,
      source: source.name,
      sourceId: source.id,
      sourceTier: source.tier || "official_primary",
      publishedAt: publishedAt || "",
      domain,
      chinaRelated: (source.regions || []).includes("china") || /中国|China|Chinese/i.test(title),
      authority: Number(source.authority || 5),
      evidence: "来自机构官方栏目页，正在核验原始页面。",
      autoPublishEligible: false
    });
  }
  const unique = [...new Map(basic.map((item) => [item.url, item])).values()].slice(0, source.maxItems || 8);
  const hydrated = await mapLimit(unique, 3, (item) => hydrateHtmlItem(item, source));
  return hydrated.filter((item) => item.publishedAt && Date.parse(item.publishedAt) >= Date.now() - windowDays * 86_400_000);
}

export function scoreArticle(article, config, history = []) {
  const ageHours = Math.max(0, (Date.now() - Date.parse(article.publishedAt)) / 3_600_000);
  const technicalSignals = hasTechnologyEvidence(article);
  const seen = history.some((record) => record.url === article.url || record.title === article.title);
  const tierAdjustment = Number(config.sourcePolicy?.[article.sourceTier] || 0);
  const score = Math.min(100,
    (article.authority || 5) * 2.5 +
    (technicalSignals ? 25 : 8) +
    Math.max(0, 20 - ageHours / 8) +
    (article.chinaRelated ? 12 : 4) +
    Math.min(10, article.domain.length * 4) +
    (article.summary.length > 90 ? 5 : 1) +
    tierAdjustment -
    (seen ? 100 : 0)
  );
  const reasons = [
    `来源权威度 ${article.authority || 5}/10`,
    `来源级别 ${article.sourceTier || "未标注"}`,
    technicalSignals ? "含工程、验证或产业化信号" : "技术实质需人工确认",
    ageHours <= 48 ? "过去 48 小时内" : `约 ${Math.round(ageHours / 24)} 天前`,
    article.chinaRelated ? "与中国相关" : "全球动态",
    "未使用无法核验的传播热度"
  ];
  return { score: Math.round(score), reasons, duplicate: seen };
}

export async function collect() {
  await ensureDirectories();
  const config = await settings();
  const sourceList = await readJson(path.join(CONFIG, "sources.json"), []);
  const searchPlan = await readJson(path.join(CONFIG, "domain-search-plan.json"), { domains: [] });
  const results = [];
  const failures = [];
  const health = [];
  const enabledSources = sourceList.filter((item) => item.enabled !== false && ["rss", "html"].includes(item.type));
  await mapLimit(enabledSources, 4, async (source) => {
    const startedAt = Date.now();
    try {
      const target = source.type === "rss" ? source.feed : source.page;
      const response = await fetch(target, {
        headers: { "user-agent": "PTA-Green-Daily/0.2 (editorial research; source links preserved)" },
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.text();
      const items = source.type === "rss" ? feedItems(payload, source) : await htmlItems(payload, source, config.candidateWindowDays || 7);
      results.push(...items);
      health.push({ id: source.id, name: source.name, type: source.type, tier: source.tier, count: items.length, ok: true, elapsedMs: Date.now() - startedAt });
    } catch (error) {
      failures.push({ source: source.name, message: error.message });
      health.push({ id: source.id, name: source.name, type: source.type, tier: source.tier, count: 0, ok: false, message: error.message, elapsedMs: Date.now() - startedAt });
    }
  });
  const deduped = [...new Map(results.map((item) => [item.url, item])).values()];
  await writeJson(path.join(RUNTIME, "articles.json"), deduped);
  const report = {
    collectedAt: new Date().toISOString(),
    sourceCount: enabledSources.length,
    healthySources: health.filter((item) => item.ok && item.count > 0).length,
    emptySources: health.filter((item) => item.ok && item.count === 0).length,
    failedSources: health.filter((item) => !item.ok).length,
    count: deduped.length,
    domainCoverage: [...new Set(deduped.flatMap((item) => item.domain || []))],
    missingDomains: searchPlan.domains
      .map((item) => item.id)
      .filter((domain) => !deduped.some((item) => item.domain?.includes(domain))),
    domainScanPlan: searchPlan.domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      directCount: deduped.filter((item) => item.domain?.includes(domain.id)).length,
      queries: domain.queries,
      status: deduped.some((item) => item.domain?.includes(domain.id)) ? "direct_result" : "search_required"
    })),
    internationalItems: deduped.filter((item) => !item.chinaRelated).length,
    internationalSearchRequired: sourceList
      .filter((item) => item.enabled === false && item.collectionMode === "search_or_authorized_api")
      .map((item) => ({ id: item.id, name: item.name, reason: item.notes })),
    failures,
    health: health.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
  };
  await writeJson(path.join(RUNTIME, "collect-report.json"), report);
  return report;
}

export async function prepare({ useSample = false } = {}) {
  await ensureDirectories();
  const config = await settings();
  const collectionReport = await readJson(path.join(RUNTIME, "collect-report.json"), null);
  const articles = useSample
    ? await readJson(path.join(DATA, "sample-items.json"), [])
    : await readJson(path.join(RUNTIME, "articles.json"), []);
  const history = await readJson(path.join(RUNTIME, "history.json"), []);
  const minimumDate = Date.now() - (config.candidateWindowDays || 3) * 86_400_000;
  const candidates = articles
    .map((item) => ({ ...item, title: decodeEntities(item.title || ""), summary: decodeEntities(item.summary || "") }))
    .filter((item) => Date.parse(item.publishedAt) >= minimumDate)
    .map((item) => ({ ...item, ...scoreArticle(item, config, history) }))
    .filter((item) => !item.duplicate && isEditorialArticle(item) && isGreenRelevant(item) && hasTechnologyEvidence(item) && item.score >= (config.scoreThreshold || 42))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
  const state = {
    date: todayInShanghai(),
    generatedAt: new Date().toISOString(),
    brandName: config.brandName,
    dailyName: config.dailyName,
    selectionLimit: config.selectionLimit || 5,
    status: "review",
    collectionReport,
    selectedIds: [],
    coverId: null,
    candidates
  };
  await writeJson(path.join(RUNTIME, "state.json"), state);
  return state;
}

export async function seed() { return prepare({ useSample: true }); }

export async function prepareFromFile(filename) {
  await ensureDirectories();
  const config = await settings();
  const collectionReport = await readJson(path.join(RUNTIME, "collect-report.json"), null);
  const articles = await readJson(path.join(DATA, filename), []);
  const history = await readJson(path.join(RUNTIME, "history.json"), []);
  const candidates = articles
    .map((item) => ({ ...item, title: decodeEntities(item.title || ""), summary: decodeEntities(item.summary || "") }))
    .map((item) => ({ ...item, ...scoreArticle(item, config, history) }))
    .filter((item) => !item.duplicate && isEditorialArticle(item) && isGreenRelevant(item) && hasTechnologyEvidence(item) && item.score >= (config.scoreThreshold || 42))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
  const state = {
    date: todayInShanghai(),
    generatedAt: new Date().toISOString(),
    brandName: config.brandName,
    dailyName: config.dailyName,
    selectionLimit: config.selectionLimit || 5,
    status: "review",
    collectionReport,
    selectedIds: [],
    coverId: null,
    candidateMethod: `verified-source-file:${filename}`,
    candidates
  };
  await writeJson(path.join(RUNTIME, "state.json"), state);
  return state;
}

export async function loadState() {
  return readJson(path.join(RUNTIME, "state.json"), null);
}

export async function updateSelection({ id, action, title }) {
  const state = await loadState();
  if (!state) throw new Error("尚未准备候选新闻。先运行 npm run prepare 或 npm run seed。");
  const found = state.candidates.find((candidate) => candidate.id === id);
  if (!found) throw new Error("找不到该候选新闻。");
  const selected = new Set(state.selectedIds || []);
  if (action === "select") {
    if (!selected.has(id) && selected.size >= state.selectionLimit) throw new Error(`最多选择 ${state.selectionLimit} 条。`);
    selected.add(id);
  }
  if (action === "deselect" || action === "ignore") {
    selected.delete(id);
    if (state.coverId === id) state.coverId = null;
  }
  if (action === "cover") {
    if (!selected.has(id) && selected.size >= state.selectionLimit) throw new Error(`最多选择 ${state.selectionLimit} 条。`);
    selected.add(id);
    state.coverId = id;
  }
  if (action === "title" && title?.trim()) found.editorTitle = title.trim().slice(0, 62);
  state.selectedIds = [...selected];
  state.updatedAt = new Date().toISOString();
  await writeJson(path.join(RUNTIME, "state.json"), state);
  return state;
}

export async function autoSelect() {
  const state = await loadState();
  if (!state) throw new Error("尚未准备候选新闻。先运行 prepare。");
  const config = await settings();
  const rules = config.autoSelection || {};
  const minimum = rules.minimum || 3;
  if (state.candidates.length < minimum) throw new Error(`候选新闻只有 ${state.candidates.length} 条，少于自动发布最低要求 ${minimum} 条；请补充可信来源后再运行。`);
  const ranked = state.candidates.filter((candidate) => candidate.autoPublishEligible !== false).sort((a, b) => b.score - a.score);
  const chosen = [];
  const coveredDomains = new Set();
  const sourceCounts = new Map();
  const canUseSource = (item) => (sourceCounts.get(item.sourceId || item.source) || 0) < (rules.maxPerSource || state.selectionLimit);
  const rememberSource = (item) => sourceCounts.set(item.sourceId || item.source, (sourceCounts.get(item.sourceId || item.source) || 0) + 1);
  const chinaCandidate = ranked.find((item) => item.chinaRelated);
  if (rules.requireChinaRelated && !chinaCandidate) throw new Error("候选池没有中国相关动态。为避免违背客户规则，系统不会自动生成日报。");
  if (chinaCandidate) {
    chosen.push(chinaCandidate);
    rememberSource(chinaCandidate);
    chinaCandidate.autoSelectionReason = "满足每日中国相关动态要求，且在候选中评分最高。";
    chinaCandidate.domain.forEach((domain) => coveredDomains.add(domain));
  }
  const globalCandidates = ranked
    .filter((item) => !item.chinaRelated && !chosen.some((selected) => selected.id === item.id))
    .slice(0, Number(rules.minimumGlobal || 0));
  if (globalCandidates.length < Number(rules.minimumGlobal || 0)) {
    throw new Error(`国际候选只有 ${globalCandidates.length} 条，少于自动发布最低要求 ${rules.minimumGlobal} 条；请运行国际检索补充后再试。`);
  }
  for (const candidate of globalCandidates) {
    if (!canUseSource(candidate)) continue;
    candidate.autoSelectionReason = "满足国际动态最低数量要求，并增加全球技术视角。";
    chosen.push(candidate);
    rememberSource(candidate);
    candidate.domain.forEach((domain) => coveredDomains.add(domain));
  }
  for (const candidate of ranked) {
    if (chosen.some((item) => item.id === candidate.id)) continue;
    if (!canUseSource(candidate)) continue;
    const bringsNewDomain = candidate.domain.some((domain) => !coveredDomains.has(domain));
    if (rules.preferDomainDiversity && !bringsNewDomain && chosen.length < minimum) continue;
    if (chosen.length >= state.selectionLimit) break;
    candidate.autoSelectionReason = bringsNewDomain ? "评分靠前，并增加了日报领域覆盖。" : "评分靠前，补足日报信息量。";
    chosen.push(candidate);
    rememberSource(candidate);
    candidate.domain.forEach((domain) => coveredDomains.add(domain));
  }
  for (const candidate of ranked) {
    if (chosen.length >= state.selectionLimit) break;
    if (chosen.some((item) => item.id === candidate.id)) continue;
    if (!canUseSource(candidate)) continue;
    candidate.autoSelectionReason = "评分靠前，补足日报信息量。";
    chosen.push(candidate);
    rememberSource(candidate);
  }
  if (chosen.length < minimum) throw new Error("自动选题不足 3 条，系统已停止。请补充来源或降低筛选阈值后再试。");
  state.selectedIds = chosen.map((item) => item.id);
  state.coverId = chosen.slice().sort((a, b) => b.score - a.score)[0].id;
  state.status = "auto_selected";
  state.updatedAt = new Date().toISOString();
  await writeJson(path.join(RUNTIME, "state.json"), state);
  return state;
}

export function selectedArticles(state) {
  return state.selectedIds.map((id) => state.candidates.find((item) => item.id === id)).filter(Boolean);
}

export function tagsFor(articles) {
  const domains = [...new Set(articles.flatMap((article) => article.domain || []))];
  return ["绿色技术", "可持续发展", ...domains.slice(0, 4).map((domain) => TOPIC_TAGS[domain]).filter(Boolean)];
}

async function command() {
  const action = process.argv[2] || "help";
  if (action === "collect") console.log(JSON.stringify(await collect(), null, 2));
  else if (action === "prepare") console.log(JSON.stringify(await prepare(), null, 2));
  else if (action === "seed") console.log(JSON.stringify(await seed(), null, 2));
  else if (action === "prepare-actual-demo") console.log(JSON.stringify(await prepareFromFile("actual-demo-2026-07-26.json"), null, 2));
  else if (action === "auto-select") console.log(JSON.stringify(await autoSelect(), null, 2));
  else if (action === "render") {
    const { renderSelected } = await import("./render.mjs");
    console.log(JSON.stringify(await renderSelected(), null, 2));
  } else if (action === "run") {
    await collect();
    await prepare();
    await autoSelect();
    const { renderSelected } = await import("./render.mjs");
    console.log(JSON.stringify(await renderSelected(), null, 2));
  } else {
    console.log("用法：node scripts/daily.mjs collect | prepare | prepare-actual-demo | auto-select | render | run | seed");
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) command().catch((error) => { console.error(error.stack); process.exit(1); });
