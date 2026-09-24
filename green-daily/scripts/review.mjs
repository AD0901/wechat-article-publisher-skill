import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME = path.join(ROOT, "runtime");
const EXPORTS = path.join(ROOT, "exports");
const ARCHIVE_FILE = path.join(RUNTIME, "archive.json");

const DOMAIN_LABELS = {
  energy_power: "能源与电力",
  building: "绿色建筑",
  industry: "绿色工业",
  transport: "绿色交通",
  agriculture: "绿色农业",
  digital: "绿色数字化",
  materials: "新材料",
  negative_emissions: "负碳技术",
  water: "水资源管理",
  circular_economy: "循环经济"
};

const OUTLOOKS = {
  energy_power: {
    judgment: "能源转型的关注点将继续从单一装机量转向电网消纳、储能配置与灵活性资源。",
    watch: "重点验证并网规模、储能时长、调峰效果、绿电交易和项目实际投运数据。"
  },
  digital: {
    judgment: "算力与能源的结合会进一步进入园区、电网和数据中心的实际调度场景。",
    watch: "重点验证可调负荷比例、绿电小时匹配率、PUE以及虚拟电厂参与市场的收益。"
  },
  industry: {
    judgment: "工业绿色技术将更强调中试、工业化放大和连续运行，而不只是实验室指标。",
    watch: "重点验证单位产品能耗、减排边界、连续运行时间和第三方核算结果。"
  },
  building: {
    judgment: "建筑领域的机会会更多出现在既有建筑改造、设备协同和实际节能绩效。",
    watch: "重点验证改造前后能耗、峰值负荷、回收期和真实使用条件。"
  },
  transport: {
    judgment: "绿色交通将继续从车辆电动化延伸至充换电网络、车网互动和全生命周期管理。",
    watch: "重点验证基础设施利用率、补能效率、电池寿命和全生命周期排放。"
  },
  materials: {
    judgment: "新材料新闻的筛选标准会更偏向量产良率、成本和真实应用，而非单点性能纪录。",
    watch: "重点验证产线规模、良率、单位成本、关键原料约束和客户验证。"
  },
  circular_economy: {
    judgment: "循环经济项目会越来越依赖稳定原料来源、回收效率和再生产品的消纳能力。",
    watch: "重点验证年处理量、回收率、再生品去向、经济性和避免的实际排放。"
  },
  agriculture: {
    judgment: "农业绿色技术将更重视减排效果与产量、成本和农户可执行性之间的平衡。",
    watch: "重点验证田间试验周期、产量变化、投入成本和甲烷或氮排放核算。"
  },
  negative_emissions: {
    judgment: "负碳技术会继续从概念承诺转向捕集量、永久性和全链条成本的核验。",
    watch: "重点验证净移除量、能耗、储存永久性、监测方案和每吨成本。"
  },
  water: {
    judgment: "水技术的绿色价值会更多由能耗、回用率和浓水或污泥处置决定。",
    watch: "重点验证吨水能耗、回用率、运行稳定性和副产物处置。"
  }
};

function todayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character]));
}

function uniqueArticles(entries) {
  const items = entries.flatMap((entry) => entry.candidates || []);
  return [...new Map(items.map((item) => [item.url || item.id, item])).values()];
}

export async function archiveState(state) {
  const archive = await readJson(ARCHIVE_FILE, []);
  const entry = {
    date: state.date || todayInShanghai(),
    archivedAt: new Date().toISOString(),
    selectedIds: state.selectedIds || [],
    candidates: (state.candidates || []).map((item) => ({
      ...item,
      selected: (state.selectedIds || []).includes(item.id)
    }))
  };
  const next = archive.filter((item) => item.date !== entry.date);
  next.push(entry);
  next.sort((a, b) => a.date.localeCompare(b.date));
  await writeJson(ARCHIVE_FILE, next.slice(-45));
  return entry;
}

export async function buildReview(days = 7) {
  const archive = await readJson(ARCHIVE_FILE, []);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(1, Number(days)));
  const entries = archive.filter((entry) => Date.parse(`${entry.date}T23:59:59+08:00`) >= cutoff.getTime());
  const articles = uniqueArticles(entries);
  const selected = articles.filter((item) => item.selected);
  const domainCounts = {};
  for (const item of articles) {
    for (const domain of item.domain || []) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  }
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, label: DOMAIN_LABELS[domain] || domain, count }));
  const distinctDates = new Set(entries.map((entry) => entry.date)).size;
  const uniqueSources = new Set(articles.map((item) => item.source).filter(Boolean)).size;
  const confidence = distinctDates >= Math.min(days, 10) && articles.length >= 15
    ? "较高"
    : distinctDates >= 3 && articles.length >= 8 ? "中等" : "较低";
  const judgments = topDomains.slice(0, 3).map(({ domain, label, count }) => ({
    topic: label,
    basisCount: count,
    judgment: OUTLOOKS[domain]?.judgment || "该领域近期出现频率较高，值得继续观察是否形成连续的工程或产业信号。",
    watch: OUTLOOKS[domain]?.watch || "重点验证后续项目、订单、运行绩效与权威数据。"
  }));
  const topStories = [...(selected.length ? selected : articles)]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8)
    .map((item) => ({
      title: item.editorTitle || item.title,
      source: item.source,
      url: item.url,
      score: item.score,
      publishedAt: item.publishedAt,
      domains: (item.domain || []).map((domain) => DOMAIN_LABELS[domain] || domain)
    }));
  const coverageGaps = Object.entries(DOMAIN_LABELS)
    .filter(([domain]) => !domainCounts[domain])
    .map(([, label]) => label);
  return {
    generatedAt: new Date().toISOString(),
    days: Number(days),
    periodLabel: Number(days) === 7 ? "近7天回顾" : Number(days) === 30 ? "近30天回顾" : `近${days}天回顾`,
    metrics: {
      archivedDays: distinctDates,
      candidates: articles.length,
      selected: selected.length,
      uniqueSources,
      averageScore: articles.length ? Math.round(articles.reduce((sum, item) => sum + (item.score || 0), 0) / articles.length) : 0,
      confidence
    },
    topDomains,
    topStories,
    judgments,
    coverageGaps,
    caveat: confidence === "较低"
      ? "当前历史样本不足，以下判断属于观察假设，不能视为趋势结论。系统会随着每日存档自动提高可信度。"
      : "以下判断来自公开新闻样本，只反映已覆盖来源，仍需结合项目数据、市场数据和政策原文验证。"
  };
}

function reviewHtml(review) {
  const domains = review.topDomains.slice(0, 6).map((item) => `<span style="display:inline-block;margin:0 8px 8px 0;padding:6px 10px;border-radius:99px;background:#e8f2e6;color:#285d48;">${escapeHtml(item.label)} ${item.count}</span>`).join("");
  const stories = review.topStories.map((item) => `<li style="margin:0 0 14px;"><strong>${escapeHtml(item.title)}</strong><br><span style="color:#607369;">${escapeHtml(item.source)} · ${item.score || 0}分</span><br><a href="${escapeHtml(item.url)}" style="color:#2c6d48;word-break:break-all;">${escapeHtml(item.url)}</a></li>`).join("");
  const judgments = review.judgments.map((item) => `<section style="margin:0 0 22px;padding:16px;border-left:4px solid #4a8a68;background:#f3f7ef;"><strong>${escapeHtml(item.topic)}｜后续判断</strong><p style="margin:8px 0;">${escapeHtml(item.judgment)}</p><p style="margin:8px 0 0;color:#526b5f;"><strong>验证指标：</strong>${escapeHtml(item.watch)}</p></section>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(review.periodLabel)}</title></head><body style="margin:0;background:#f3f5ef;color:#23352e;font-family:PingFang SC,Microsoft YaHei,Arial;"><main style="max-width:677px;margin:0 auto;padding:28px 18px 60px;background:#fff;line-height:1.8;"><h1 style="color:#123f33;">${escapeHtml(review.periodLabel)}</h1><p>${escapeHtml(review.caveat)}</p><p><strong>${review.metrics.archivedDays}</strong> 个存档日 · <strong>${review.metrics.candidates}</strong> 条候选 · <strong>${review.metrics.uniqueSources}</strong> 个来源 · 可信度 <strong>${review.metrics.confidence}</strong></p><h2>领域分布</h2><p>${domains || "暂无数据"}</p><h2>重要新闻</h2><ol style="padding-left:22px;">${stories || "<li>暂无数据</li>"}</ol><h2>对之后的判断</h2>${judgments || "<p>历史数据不足，暂不生成判断。</p>"}<h2>尚未覆盖的领域</h2><p>${escapeHtml(review.coverageGaps.join("、") || "主要领域均有样本")}</p></main></body></html>`;
}

export async function generateReview(days = 7) {
  const review = await buildReview(days);
  const output = path.join(EXPORTS, todayInShanghai());
  const basename = Number(days) === 7 ? "weekly-review" : Number(days) === 30 ? "monthly-review" : `${days}-day-review`;
  await fs.mkdir(output, { recursive: true });
  await writeJson(path.join(output, `${basename}.json`), review);
  await fs.writeFile(path.join(output, `${basename}.html`), reviewHtml(review), "utf8");
  return { ...review, htmlPath: path.join(output, `${basename}.html`) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateReview(Number(process.argv[2] || 7))
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => { console.error(error.stack); process.exit(1); });
}
