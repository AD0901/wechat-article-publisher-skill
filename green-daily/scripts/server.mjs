import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadState, updateSelection } from "./daily.mjs";
import { generateReview } from "./review.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "web");
const PORT = Number(process.env.PORT || 8787);

const contentType = (file) => ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" }[path.extname(file)] || "application/octet-stream");

async function body(request) {
  const parts = [];
  for await (const chunk of request) parts.push(chunk);
  return JSON.parse(Buffer.concat(parts).toString("utf8") || "{}");
}

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === "/api/state" && request.method === "GET") return send(response, 200, { state: await loadState() });
    if (url.pathname === "/api/review" && request.method === "GET") {
      const days = [7, 30].includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 7;
      return send(response, 200, { review: await generateReview(days) });
    }
    if (url.pathname === "/api/selection" && request.method === "POST") return send(response, 200, { state: await updateSelection(await body(request)) });
    if (url.pathname === "/api/render" && request.method === "POST") {
      const { renderSelected } = await import("./render.mjs");
      return send(response, 200, { manifest: await renderSelected() });
    }
    if (url.pathname === "/api/publish" && request.method === "POST") {
      const { publishWechatDraft } = await import("./wechat-draft.mjs");
      return send(response, 200, { result: await publishWechatDraft() });
    }
    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = path.resolve(WEB, requested);
    if (!file.startsWith(`${WEB}${path.sep}`) && file !== path.join(WEB, "index.html")) return send(response, 403, { error: "forbidden" });
    const data = await fs.readFile(file);
    response.writeHead(200, { "content-type": contentType(file) });
    response.end(data);
  } catch (error) {
    send(response, error.message.includes("找不到") || error.code === "ENOENT" ? 404 : 400, { error: error.message });
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`绿色日报手机编辑台： http://localhost:${PORT}`));
