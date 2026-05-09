#!/usr/bin/env python3
"""
微信公众号文章发布脚本
用法: python3 publish_wechat.py --article 文章.md --title "标题" --author "作者" [--digest "摘要"]
凭证从 ~/.wechat/config 读取 (WECHAT_APPID, WECHAT_APPSECRET)
"""

import json, re, urllib.request, sys, os, mimetypes, argparse


# ============================================================
# 微信 CSS 白名单约束 — 只使用这些属性
# 禁止: position, box-shadow, border-radius, background-image,
#       linear-gradient, rgba(), ::before/::after, <style>, <ol>/<ul>/<li>
# ============================================================


def load_config():
    """从 ~/.wechat/config 读取凭据"""
    config_path = os.path.expanduser("~/.wechat/config")
    if not os.path.exists(config_path):
        print("[ERROR] 未找到 ~/.wechat/config，请先配置:")
        print("  mkdir -p ~/.wechat")
        print("  echo 'WECHAT_APPID=wxXXXX' >> ~/.wechat/config")
        print("  echo 'WECHAT_APPSECRET=xxxx' >> ~/.wechat/config")
        print("  chmod 600 ~/.wechat/config")
        sys.exit(1)

    config = {}
    with open(config_path) as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                config[k.strip()] = v.strip()
    if "WECHAT_APPID" not in config or "WECHAT_APPSECRET" not in config:
        print("[ERROR] ~/.wechat/config 缺少 WECHAT_APPID 或 WECHAT_APPSECRET")
        sys.exit(1)
    return config["WECHAT_APPID"], config["WECHAT_APPSECRET"]


def get_access_token(appid, secret):
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
    with urllib.request.urlopen(urllib.request.Request(url)) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "access_token" in data:
        print("[OK] access_token 获取成功")
        return data["access_token"]
    print(f"[ERROR] token 获取失败: {data}")
    if data.get("errcode") == 40164:
        print("  → IP 不在白名单，需去公众号后台添加")
    sys.exit(1)


def upload_thumb(access_token, image_path):
    boundary = "----FormBoundary7MA4YWxk"
    filename = os.path.basename(image_path)
    ct = mimetypes.guess_type(image_path)[0] or "image/png"
    with open(image_path, "rb") as f:
        file_data = f.read()
    body = []
    body.append(f"--{boundary}".encode())
    body.append(f'Content-Disposition: form-data; name="media"; filename="{filename}"'.encode())
    body.append(f"Content-Type: {ct}".encode())
    body.append(b"")
    body.append(file_data)
    body.append(f"--{boundary}--".encode())
    payload = b"\r\n".join(body)
    url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={access_token}&type=image"
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "media_id" in data:
        print(f"[OK] 封面上传成功")
        return data["media_id"]
    print(f"[ERROR] 封面上传失败: {data}")
    sys.exit(1)


def create_draft(access_token, title, content, author, digest, thumb_id):
    url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}"
    article = {
        "title": title, "author": author, "digest": digest,
        "content": content, "thumb_media_id": thumb_id,
        "content_source_url": "", "need_open_comment": 0, "only_fans_can_comment": 0,
    }
    payload = json.dumps({"articles": [article]}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "media_id" in data:
        print(f"[OK] 草稿创建成功")
        return data["media_id"]
    print(f"[ERROR] 草稿创建失败: {data}")
    sys.exit(1)


def publish_draft(access_token, media_id):
    url = f"https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token={access_token}"
    payload = json.dumps({"media_id": media_id}).encode("utf-8")
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if data.get("errcode", 0) == 0:
        print(f"[OK] 发布成功！publish_id: {data.get('publish_id', 'N/A')}")
    elif data.get("errcode") == 48001:
        print("[INFO] 订阅号无 API 发布权限，请手动去微信公众平台草稿箱发布")
    else:
        print(f"[WARN] 发布失败: {data}")
    return data


def generate_cover(title, bg_color="#fdf6e3", output="cover.png"):
    """生成 900x383 封面图"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("[WARN] PIL 未安装，跳过封面生成。请 pip3 install Pillow")
        return None

    import math
    img = Image.new('RGB', (900, 383), bg_color)
    draw = ImageDraw.Draw(img)

    # 横线纹理
    for y in range(0, 383, 28):
        draw.line([(0, y), (900, y)], fill='#e8dcc8', width=1)

    # 装订线
    draw.line([(50, 0), (50, 383)], fill='#e8a0a0', width=2)

    try:
        font = ImageFont.truetype('/System/Library/Fonts/STHeiti Light.ttc', 38)
        small_font = ImageFont.truetype('/System/Library/Fonts/STHeiti Light.ttc', 20)
    except Exception:
        font = ImageFont.load_default()
        small_font = font

    # 标题（截取前20字）
    disp_title = title[:20]
    draw.text((80, 90), '✦', fill='#e06060', font=small_font)
    draw.text((80, 110), disp_title, fill='#2c2c2c', font=font)

    # 波浪线
    points = [(x, 175 + 3 * math.sin(x * 0.05)) for x in range(80, 80 + len(disp_title) * 22)]
    if len(points) > 1:
        draw.line(points, fill='#e06060', width=2)

    draw.text((80, 210), '课堂笔记', fill='#8b7355', font=small_font)

    img.save(output, 'PNG')
    print(f"[OK] 封面图已生成: {output}")
    return output


# ============================================================
# Markdown → 微信兼容 HTML 转换器
# 关键约束：不用 <style>、<ol>、<ul>、<li>、position、gradient、shadow
# ============================================================

def inline_format(text):
    text = re.sub(r'`([^`]+)`',
        r'<code style="color:#c0392b;background-color:#fef9e7;padding:2px 6px;font-size:14px;border-bottom:1px dotted #c0392b;">\1</code>',
        text)
    text = re.sub(r'\*\*([^*]+)\*\*',
        r'<strong style="color:#2c2c2c;font-weight:700;border-bottom:2px solid #f39c12;padding-bottom:1px;">\1</strong>',
        text)
    text = re.sub(r'\*([^*]+)\*',
        r'<em style="background-color:#fff176;font-style:normal;padding:0 3px;">\1</em>',
        text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',
        r'<a href="\2" style="color:#2962a0;text-decoration:none;border-bottom:1px dashed #2962a0;">\1</a>',
        text)
    return text


def md_to_wechat_html(md_text):
    lines = md_text.strip().split("\n")
    html = []
    in_code, code_lines = False, []
    in_table, table_rows = False, []
    in_bq, bq_lines = False, []

    def flush_bq():
        nonlocal in_bq, bq_lines
        if in_bq and bq_lines:
            inner = "".join(
                f'<p style="margin:4px 0;letter-spacing:0.5px;line-height:1.9;color:#5d4e37;">{l}</p>'
                for l in bq_lines)
            html.append(
                f'<blockquote style="background-color:#fff9c4;border-left:4px solid #f9a825;'
                f'margin:1.5em 0;padding:12px 16px;font-size:15px;color:#5d4e37;">'
                f'<p style="margin:0 0 6px 0;font-size:0.85em;">📝</p>{inner}</blockquote>')
            bq_lines = []; in_bq = False

    def flush_table():
        nonlocal in_table, table_rows
        if in_table and table_rows:
            html.append(
                '<table style="border-collapse:collapse;margin:1.4em auto;max-width:100%;'
                'text-align:left;font-size:15px;border:2px solid #8b7355;">')
            for i, row in enumerate(table_rows):
                cells = [c.strip() for c in row.split("|")[1:-1]]
                if i == 0:
                    html.append("<thead><tr>")
                    for cell in cells:
                        html.append(
                            f'<th style="background-color:#e8dcc8;color:#3a3a3a;font-weight:700;'
                            f'padding:10px 14px;border-bottom:2px solid #8b7355;text-align:center;">'
                            f'{inline_format(cell)}</th>')
                    html.append("</tr></thead><tbody>")
                elif not all(set(c.strip()) <= set("-| ") for c in cells):
                    bg = 'background-color:#fdf8ec;' if i % 2 == 0 else ''
                    html.append("<tr>")
                    for cell in cells:
                        html.append(
                            f'<td style="padding:9px 14px;border-bottom:1px dashed #c4b896;'
                            f'color:#4a4a4a;vertical-align:top;line-height:1.6;{bg}">'
                            f'{inline_format(cell)}</td>')
                    html.append("</tr>")
            html.append("</tbody></table>")
            table_rows = []; in_table = False

    for line in lines:
        s = line.strip()

        if s.startswith("```"):
            if in_code:
                ct = "\n".join(code_lines).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                html.append(
                    f'<section style="border:2px dashed #8b7355;margin:1.4em 0;padding:20px 16px 16px;'
                    f'font-size:13px;line-height:1.9;overflow-x:auto;background-color:#f9f3e3;">'
                    f'<p style="font-size:13px;color:#8b6914;font-weight:700;margin:0 0 8px 0;">💡 重点</p>'
                    f'<code style="display:block;font-size:13px;color:#4a3f2f;">{ct}</code></section>')
                code_lines = []; in_code = False
            else:
                flush_bq(); flush_table()
                in_code = True
            continue
        if in_code:
            code_lines.append(line); continue

        if s.startswith("> "):
            flush_table()
            in_bq = True
            bq_lines.append(inline_format(s[2:]))
            continue
        elif in_bq and s == "":
            flush_bq(); continue
        elif in_bq:
            flush_bq()

        if s == "":
            flush_table(); continue

        if s == "---":
            flush_bq(); flush_table()
            html.append(
                '<p style="text-align:center;margin:2em 0;color:#b8a88a;'
                'font-size:15px;letter-spacing:6px;">· · · ✦ · · ·</p>')
            continue

        if "|" in s and s.startswith("|"):
            flush_bq()
            in_table = True
            table_rows.append(s); continue
        else:
            flush_table()

        h_match = re.match(r'^(#{1,6})\s+(.+)', s)
        if h_match:
            flush_bq()
            level = len(h_match.group(1))
            title = inline_format(h_match.group(2))
            if level == 1:
                html.append(
                    f'<h1 style="text-align:center;font-size:1.65em;font-weight:900;color:#2c2c2c;'
                    f'letter-spacing:1px;margin:1.2em 0 0.4em;padding:12px 20px;">✦ {title}</h1>'
                    f'<p style="text-align:center;font-size:15px;color:#e06060;'
                    f'letter-spacing:4px;margin:0 0 1em 0;">〰〰〰〰〰〰〰〰〰〰</p>')
            elif level == 2:
                html.append(
                    f'<h2 style="font-size:1.3em;font-weight:700;color:#3a5a8c;'
                    f'margin:1.8em 0 0.4em;padding:6px 0 6px 12px;'
                    f'border-left:5px solid #ffeb3b;">{title}</h2>'
                    f'<p style="border-bottom:2px dashed #b0c4de;margin:0 0 0.8em 0;'
                    f'height:0;font-size:0;line-height:0;overflow:hidden;">-</p>')
            elif level == 3:
                html.append(
                    f'<h3 style="font-size:1.15em;font-weight:600;color:#4a6a5a;'
                    f'margin:1.4em 0 0.5em;padding-left:4px;">✎ {title}</h3>')
            else:
                html.append(
                    f'<h{level} style="font-size:1.1em;font-weight:600;color:#3a3a3a;'
                    f'margin:1.2em 0 0.5em;">{title}</h{level}>')
            continue

        ul_match = re.match(r'^[-*]\s+(.+)', s)
        if ul_match:
            flush_bq(); flush_table()
            content = inline_format(ul_match.group(1))
            html.append(
                f'<p style="padding-left:24px;margin:0.35em 0;line-height:1.8;'
                f'letter-spacing:0.5px;color:#3a3a3a;">'
                f'<span style="color:#8b7355;">◦</span> {content}</p>')
            continue

        ol_match = re.match(r'^(\d+)\.\s+(.+)', s)
        if ol_match:
            flush_bq(); flush_table()
            num = ol_match.group(1)
            content = inline_format(ol_match.group(2))
            html.append(
                f'<p style="padding-left:24px;margin:0.35em 0;line-height:1.8;'
                f'letter-spacing:0.5px;color:#3a3a3a;">'
                f'<strong style="color:#3a5a8c;font-weight:700;">{num}.</strong> {content}</p>')
            continue

        flush_bq(); flush_table()
        html.append(
            f'<p style="letter-spacing:0.5px;line-height:1.9;margin:0.8em 0;color:#3a3a3a;">'
            f'{inline_format(s)}</p>')

    flush_bq(); flush_table()

    # footer
    html.append(
        '<p style="text-align:center;margin-top:2em;padding-top:16px;'
        'border-top:2px dashed #b8a88a;color:#8b7355;font-size:15px;">'
        '✏️ 发布自 WeChat Publisher</p>')

    content = "\n".join(html)
    wrapper = (
        '<section style="line-height:1.85;font-size:16px;color:#3a3a3a;'
        'padding:20px 16px 30px;background-color:#fdf6e3;">'
        f'{content}</section>')
    return wrapper


def main():
    parser = argparse.ArgumentParser(description="微信公众号文章发布")
    parser.add_argument("--article", required=True, help="Markdown 文章路径")
    parser.add_argument("--title", required=True, help="文章标题")
    parser.add_argument("--author", default="", help="作者")
    parser.add_argument("--digest", default="", help="摘要")
    args = parser.parse_args()

    print("=" * 50)
    print("微信公众号文章发布工具")

    appid, secret = load_config()

    print("\n[1/6] 读取文章...")
    with open(args.article, "r", encoding="utf-8") as f:
        md_text = f.read()

    print("\n[2/6] 转为微信兼容 HTML...")
    final_html = md_to_wechat_html(md_text)

    preview = os.path.splitext(args.article)[0] + "-预览.html"
    with open(preview, "w", encoding="utf-8") as f:
        f.write(f'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>{args.title}</title>'
                f'</head><body style="margin:0;background:#f5f5f5;">'
                f'<div style="max-width:420px;margin:20px auto;">{final_html}</div>'
                f'</body></html>')
    print(f"  预览: {preview}")

    print("\n[3/6] 生成封面图...")
    cover = generate_cover(args.title)
    if not cover:
        print("[ERROR] 封面图生成失败")
        sys.exit(1)

    print("\n[4/6] 获取 access_token...")
    token = get_access_token(appid, secret)

    print("\n[5/6] 上传封面 + 创建草稿...")
    thumb_id = upload_thumb(token, cover)
    media_id = create_draft(token, args.title, final_html, args.author or "WeChat Publisher", args.digest, thumb_id)

    print("\n[6/6] 发布...")
    publish_draft(token, media_id)

    print("\n完成！请去微信公众平台草稿箱确认。")
    print("⚠️  AppSecret 如在对话中出现过，请尽快重置。")


if __name__ == "__main__":
    main()
