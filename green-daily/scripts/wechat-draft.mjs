import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { readJson, todayInShanghai, writeJson } from "./daily.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const EXPORTS = path.join(ROOT, "exports");
const RUNTIME = path.join(ROOT, "runtime");
const MAX_NEWSPIC_IMAGES = 20;
const PUBLISH_MODE = process.env.WECHAT_PUBLISH_MODE || "draft_only";

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

function newspicTitle(manifest) {
  return `${manifest.brandName || "PTA Green Tech Daily"}｜${manifest.date}`.slice(0, 32);
}

function newspicContent(manifest) {
  const lines = [`🌍 ${manifest.dateTitle || newspicTitle(manifest)}`, ""];
  for (const [index, item] of manifest.selected.entries()) {
    lines.push(`${index + 1}. ${item.editorTitle || item.title}`);
    lines.push(item.summary);
    lines.push(`原文：${item.url}`);
    lines.push("");
  }
  if (manifest.activity?.title) {
    lines.push(`🔥 ${manifest.activity.title}`);
    if (manifest.activity.body) lines.push(manifest.activity.body);
    if (manifest.activity.url) lines.push(`活动链接：${manifest.activity.url}`);
  }
  return lines.join("\n").trim();
}

async function validateNewspicFiles(manifest) {
  const files = manifest.bodyFiles || manifest.files || [];
  if (files.length < 1 || files.length > MAX_NEWSPIC_IMAGES) {
    throw new Error(`贴图必须包含 1–${MAX_NEWSPIC_IMAGES} 张图片，当前为 ${files.length} 张。`);
  }
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(extension)) {
      throw new Error(`贴图格式不受支持：${file}`);
    }
    const stat = await fs.stat(file);
    if (stat.size > 2 * 1024 * 1024) throw new Error(`贴图超过 2MB：${file}`);
  }
  return files;
}

async function addDraft(accessToken, article) {
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: Buffer.from(JSON.stringify({ articles: [article] }), "utf8")
  });
  const payload = await response.json();
  if (!response.ok || payload.errcode || !payload.media_id) {
    throw new Error(`创建公众号贴图草稿失败：${JSON.stringify(payload)}`);
  }
  return payload.media_id;
}

async function submitForPublish(accessToken, mediaId) {
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ media_id: mediaId })
  });
  const payload = await response.json();
  if (!response.ok || payload.errcode || !payload.publish_id) {
    throw new Error(`贴图已进入草稿箱，但自动提交发布失败：${JSON.stringify(payload)}`);
  }
  return {
    submittedAt: new Date().toISOString(),
    publishId: payload.publish_id,
    status: "submitted_for_wechat_review"
  };
}

async function createNewspicDraft({ accessToken, manifest, output }) {
  if (!["draft_only", "auto_submit"].includes(PUBLISH_MODE)) {
    throw new Error(`WECHAT_PUBLISH_MODE 只允许 draft_only 或 auto_submit，当前为 ${PUBLISH_MODE}。`);
  }
  const existing = await readJson(path.join(output, "wechat-draft-result.json"), null);
  if (existing?.draftType === "newspic" && existing?.mediaId) {
    throw new Error(`当天贴图草稿已经创建：${existing.mediaId}。为防止重复，请先在公众号后台确认。`);
  }
  const files = await validateNewspicFiles(manifest);
  const imageMediaIds = [];
  for (const file of files) {
    const uploaded = await multipartUpload(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
      file
    );
    if (!uploaded.media_id) throw new Error(`贴图上传没有返回 media_id：${JSON.stringify(uploaded)}`);
    imageMediaIds.push(uploaded.media_id);
  }
  const article = {
    article_type: "newspic",
    title: newspicTitle(manifest),
    content: newspicContent(manifest),
    image_info: {
      image_list: imageMediaIds.map((image_media_id) => ({ image_media_id }))
    },
    need_open_comment: 1,
    only_fans_can_comment: 0
  };
  const mediaId = await addDraft(accessToken, article);
  const publish = PUBLISH_MODE === "auto_submit" ? await submitForPublish(accessToken, mediaId) : null;
  const result = {
    createdAt: new Date().toISOString(),
    draftType: "newspic",
    mode: PUBLISH_MODE,
    mediaId,
    imageMediaIds,
    publish
  };
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
  return createNewspicDraft({ accessToken, manifest, output });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  publishWechatDraft()
    .then((result) => {
      const suffix = result.publish ? `，已提交微信审核：${result.publish.publishId}` : "";
      console.log(`✅ 贴图草稿已创建：${result.mediaId}${suffix}`);
    })
    .catch((error) => { console.error(error.message); process.exit(1); });
}
