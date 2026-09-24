let state;
const $ = (selector) => document.querySelector(selector);

function selected() { return new Set(state?.selectedIds || []); }
function show(message, error = false) {
  const notice = $("#notice"); notice.textContent = message; notice.className = `notice${error ? " error" : ""}`;
}
function hideNotice() { $("#notice").className = "notice hidden"; }
function safeUrl(value = "") {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch { return "#"; }
}

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { "content-type": "application/json" }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "操作失败");
  return data;
}

function candidateCard(item) {
  const chosen = selected().has(item.id);
  const isCover = state.coverId === item.id;
  const title = item.editorTitle || item.title;
  const sourceUrl = safeUrl(item.url);
  return `<article class="card ${chosen ? "selected" : ""}">
    <div class="topline"><span>${item.domain.map((domain) => ({energy_power:"能源电力",building:"建筑",industry:"工业",transport:"交通",agriculture:"农业",digital:"数字化",materials:"新材料",negative_emissions:"负碳",water:"水资源",circular_economy:"循环经济"}[domain] || domain)).join(" · ")}</span><span class="score">${item.score} 分</span></div>
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(item.summary)}</p>
    <div class="reasons">${item.reasons.map(escapeHtml).join("<br>")}</div>
    <div class="source-box">
      <strong>数据源</strong>
      <a class="source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">直接打开原文 · ${escapeHtml(item.source)}</a>
      <span class="source-url">${escapeHtml(item.url)}</span>
      <button class="copy-link" data-copy-url="${escapeHtml(item.url)}">复制网址</button>
    </div>
    <div class="actions">
      <button data-action="${chosen ? "deselect" : "select"}" data-id="${item.id}">${chosen ? "取消选择" : "选入日报"}</button>
      <button class="cover" data-action="cover" data-id="${item.id}">${isCover ? "✓ 今日封面" : "设为封面"}</button>
      <button data-action="ignore" data-id="${item.id}">忽略</button>
    </div>
  </article>`;
}

function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character])); }

function render() {
  if (!state) return;
  const sourceStatus = state.collectionReport
    ? ` · 来源 ${state.collectionReport.healthySources}/${state.collectionReport.sourceCount} 正常`
    : "";
  $("#meta").textContent = `${state.date} · 候选 ${state.candidates.length} 条${sourceStatus} · 最多选择 ${state.selectionLimit} 条`;
  $("#selected-count").textContent = `${state.selectedIds.length} / ${state.selectionLimit}`;
  $("#render").disabled = state.selectedIds.length < 3;
  $("#candidates").innerHTML = state.candidates.map(candidateCard).join("");
  $("#candidates").querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => change(button.dataset.id, button.dataset.action)));
  $("#candidates").querySelectorAll("[data-copy-url]").forEach((button) => button.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(button.dataset.copyUrl); show("数据源网址已复制。"); }
    catch { show("复制失败，请长按网址复制。", true); }
  }));
}

function reviewHtml(review) {
  const domains = review.topDomains.slice(0, 6).map((item) => `<span class="domain-chip">${escapeHtml(item.label)} ${item.count}</span>`).join("");
  const stories = review.topStories.map((item, index) => `<article class="review-story">
    <div class="topline"><span>${escapeHtml(item.domains.join(" · "))}</span><span class="score">${item.score || 0} 分</span></div>
    <h2>${index + 1}. ${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.source)}</p>
    <a class="source" href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">打开原始数据源</a>
    <span class="source-url">${escapeHtml(item.url)}</span>
  </article>`).join("");
  const judgments = review.judgments.map((item) => `<article class="judgment">
    <h2>${escapeHtml(item.topic)}｜后续判断</h2>
    <p>${escapeHtml(item.judgment)}</p>
    <p><strong>验证指标：</strong>${escapeHtml(item.watch)}</p>
  </article>`).join("");
  return `<section class="review-head">
    <p class="eyebrow">TREND REVIEW</p><h1>${escapeHtml(review.periodLabel)}</h1>
    <p class="muted">${escapeHtml(review.caveat)}</p>
    <div class="metric-grid">
      <div><strong>${review.metrics.archivedDays}</strong><span>存档日</span></div>
      <div><strong>${review.metrics.candidates}</strong><span>候选</span></div>
      <div><strong>${review.metrics.uniqueSources}</strong><span>来源</span></div>
      <div><strong>${escapeHtml(review.metrics.confidence)}</strong><span>可信度</span></div>
    </div>
  </section>
  <section class="review-section"><h2>领域分布</h2><div>${domains || "暂无历史数据"}</div></section>
  <section class="review-section"><h2>重要新闻与数据源</h2><div class="cards">${stories || "<p>暂无历史数据。</p>"}</div></section>
  <section class="review-section"><h2>对之后的判断</h2><div class="cards">${judgments || "<p>历史数据不足，暂不生成判断。</p>"}</div></section>
  <section class="review-section"><h2>尚未覆盖的领域</h2><p>${escapeHtml(review.coverageGaps.join("、") || "主要领域均有样本")}</p></section>`;
}

async function switchView(view) {
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $("#today-view").classList.toggle("hidden", view !== "today");
  $("#review-view").classList.toggle("hidden", view === "today");
  if (view === "today") return;
  try {
    hideNotice();
    $("#review-view").innerHTML = `<p class="muted">正在生成近 ${view} 天回顾…</p>`;
    const { review } = await api(`/api/review?days=${view}`);
    $("#review-view").innerHTML = reviewHtml(review);
  } catch (error) { show(error.message, true); }
}

async function change(id, action) {
  try { hideNotice(); state = (await api("/api/selection", { method: "POST", body: JSON.stringify({ id, action }) })).state; render(); }
  catch (error) { show(error.message, true); }
}

$("#render").addEventListener("click", async () => {
  try {
    hideNotice(); $("#render").disabled = true; $("#render").textContent = "正在生成…";
    const { manifest } = await api("/api/render", { method: "POST", body: "{}" });
    const result = $("#result"); result.className = "result";
    result.innerHTML = `<strong>日报图片已生成</strong><br>手机上可直接打开下列文件夹下载图片；公众号 API 配置好后，再点“创建贴图草稿”。<a href="file://${manifest.files[0]}">${manifest.files[0]}</a>`;
  } catch (error) { show(error.message, true); }
  finally { $("#render").textContent = "生成日报图片"; $("#render").disabled = state.selectedIds.length < 3; }
});

async function init() {
  try { state = (await api("/api/state")).state; if (!state) show("还没有候选新闻。请先在服务端运行 npm run prepare 或 npm run seed。", true); render(); }
  catch (error) { show(error.message, true); }
}
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
init();
