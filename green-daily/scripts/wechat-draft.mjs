import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { readJson, todayInShanghai, writeJson } from "./daily.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const EXPORTS = path.join(ROOT, "exports");
const RUNTIME = path.join(ROOT, "runtime");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少 ${name}。请在安全的运行环境中配置，勿写入仓库。`);
  return value;
}

async function getToken() {
  const body = {
    grant_type: "client_credential",
    appid: required("WECHAT_APPID"),
    secret: required("WECHAT_APPSECRET"),
    force_refresh: false
  };
  const response = await fetch("https://api.weixin.qq.com/cgi-bin/stable_token", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok || payload.errcode || !payload.access_token) throw new Error(`获取公众号 token 失败：${JSON.stringify(payload)}`);
  return payload.access_token;
}

async function multipartUpload(url, file, fieldName = "media") {
  const boundary = `----PTAGreenDaily${crypto.randomBytes(12).toString("hex")}`;
  const bytes = await fs.readFile(file);
  const mime = file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg" : "image/png";
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${path.basename(file)}"\r\nContent-Type: ${mime}\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const response = await fetch(url, {
    method: "POST", headers: { "content-type": `multipart/form-data; boundary=${boundary}` }, body: Buffer.concat([head, bytes, tail])
  });
  const payload = await response.json();
  if (!response.ok || payload.errcode) throw new Error(`图片上传失败：${JSON.stringify(payload)}`);
  return payload;
}

async function createDraft({ accessToken, manifest, output }) {
  const thumb = await multipartUpload(`https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=thumb`, manifest.wechatCoverPath);
  if (!thumb.media_id) throw new Error(`封面上传没有返回 media_id：${JSON.stringify(thumb)}`);
  const imageUrls = [];
  for (const file of manifest.bodyFiles || manifest.files) {
    const uploaded = await multipartUpload(`https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`, file);
    if (!uploaded.url) throw new Error(`正文图片上传没有返回 URL：${JSON.stringify(uploaded)}`);
    imageUrls.push(uploaded.url);
  }
  let content = await fs.readFile(manifest.htmlPath, "utf8");
  imageUrls.forEach((url, index) => { content = content.replaceAll(`{{CARD_${index + 1}}}`, url); });
  const article = {
    title: manifest.dateTitle.slice(0, 64),
    author: "",
    digest: `PTA Green Tech Daily 精选 ${manifest.selected.length} 条全球绿色技术新进展，附可核验原文链接。`.slice(0, 120),
    content,
    content_source_url: manifest.selected[0]?.url || "",
    thumb_media_id: thumb.media_id,
    need_open_comment: 1,
    only_fans_can_comment: 0
  };
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`, {
    method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: Buffer.from(JSON.stringify({ articles: [article] }), "utf8")
  });
  const payload = await response.json();
  if (!response.ok || payload.errcode || !payload.media_id) throw new Error(`创建公众号草稿失败：${JSON.stringify(payload)}`);
  const result = { createdAt: new Date().toISOString(), mode: "draft_only", mediaId: payload.media_id, thumbMediaId: thumb.media_id, imageUrls };
  await writeJson(path.join(output, "wechat-draft-result.json"), result);
  const previous = await readJson(path.join(RUNTIME, "history.json"), []);
  const drafted = manifest.selected.map((item) => ({
    url: item.url,
    title: item.title,
    publishedAt: item.publishedAt,
    draftedAt: result.createdAt,
    draftMediaId: result.mediaId
  }));
  const history = [...new Map([...drafted, ...previous].map((item) => [item.url || item.title, item])).values()].slice(0, 500);
  await writeJson(path.join(RUNTIME, "history.json"), history);
  return result;
}

export async function publishWechatDraft() {
  const date = todayInShanghai();
  const output = path.join(EXPORTS, date);
  const manifest = JSON.parse(await fs.readFile(path.join(output, "manifest.json"), "utf8"));
  const accessToken = await getToken();
  return createDraft({ accessToken, manifest, output });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  publishWechatDraft().then((result) => console.log(`✅ 草稿已创建：${result.mediaId}`)).catch((error) => { console.error(error.message); process.exit(1); });
}
