#!/usr/bin/env python3
"""
多主题微信公众号文章发布脚本
支持多种视觉风格: 简约专业风 / 清新科技风 / 暖色人文风 / 赛博朋克霓虹风
"""

import json, re, urllib.request, sys, os, mimetypes, argparse, math, html as html_lib


# ============================================================
# 三套主题定义 — 仅使用微信 CSS 白名单内属性
# ============================================================

THEMES = {
    "minimal": {
        "name": "简约专业风",
        "wrapper_bg": "#ffffff",
        "text_color": "#2c2c2c",
        "p_color": "#3a3a3a",
        "h1_color": "#1a1a1a",
        "h1_deco_char": "",
        "h1_wave": False,
        "h2_color": "#2c2c2c",
        "h2_border_left": "4px solid #333333",
        "h2_dash_color": "#cccccc",
        "h3_color": "#555555",
        "h3_prefix": "▸",
        "strong_color": "#1a1a1a",
        "strong_border": "none",
        "em_bg": "#f5f5f5",
        "em_color": "#333333",
        "code_color": "#555555",
        "code_bg": "#f5f5f5",
        "code_border": "1px solid #e0e0e0",
        "a_color": "#444444",
        "a_border": "1px solid #999999",
        "blockquote_bg": "#f9f9f9",
        "blockquote_border": "3px solid #555555",
        "blockquote_color": "#444444",
        "blockquote_icon": "",
        "code_block_bg": "#f7f7f7",
        "code_block_border": "1px solid #e0e0e0",
        "code_block_text": "#333333",
        "code_block_label": "CODE",
        "code_block_label_color": "#666666",
        "table_border": "1px solid #cccccc",
        "th_bg": "#333333",
        "th_color": "#ffffff",
        "td_border": "1px solid #e0e0e0",
        "td_color": "#3a3a3a",
        "td_even_bg": "#fafafa",
        "list_bullet_color": "#666666",
        "ol_num_color": "#333333",
        "hr_color": "#cccccc",
        "footer_color": "#999999",
        "footer_border": "1px solid #e0e0e0",
        "cover_bg": "#ffffff",
        "cover_text": "#1a1a1a",
        "cover_accent": "#333333",
    },
    "tech": {
        "name": "清新科技风",
        "wrapper_bg": "#f8faff",
        "text_color": "#1a1a2e",
        "p_color": "#2c3e50",
        "h1_color": "#1e3a5f",
        "h1_deco_char": "◇",
        "h1_wave": False,
        "h2_color": "#1e40af",
        "h2_border_left": "5px solid #3b82f6",
        "h2_dash_color": "#93c5fd",
        "h3_color": "#2563eb",
        "h3_prefix": "◆",
        "strong_color": "#1e3a5f",
        "strong_border": "bottom:2px solid #60a5fa",
        "em_bg": "#dbeafe",
        "em_color": "#1e40af",
        "code_color": "#1e40af",
        "code_bg": "#eff6ff",
        "code_border": "bottom:1px dotted #3b82f6",
        "a_color": "#2563eb",
        "a_border": "1px dashed #60a5fa",
        "blockquote_bg": "#eff6ff",
        "blockquote_border": "4px solid #3b82f6",
        "blockquote_color": "#1e3a5f",
        "blockquote_icon": "💡",
        "code_block_bg": "#f0f4ff",
        "code_block_border": "1px solid #bfdbfe",
        "code_block_text": "#1e3a5f",
        "code_block_label": "CODE",
        "code_block_label_color": "#3b82f6",
        "table_border": "1px solid #bfdbfe",
        "th_bg": "#2563eb",
        "th_color": "#ffffff",
        "td_border": "1px solid #dbeafe",
        "td_color": "#2c3e50",
        "td_even_bg": "#f8faff",
        "list_bullet_color": "#3b82f6",
        "ol_num_color": "#2563eb",
        "hr_color": "#bfdbfe",
        "footer_color": "#93c5fd",
        "footer_border": "1px solid #dbeafe",
        "cover_bg": "#1e3a5f",
        "cover_text": "#ffffff",
        "cover_accent": "#60a5fa",
    },
    "warm": {
        "name": "暖色人文风",
        "wrapper_bg": "#fef9f0",
        "text_color": "#4a3728",
        "p_color": "#5c4332",
        "h1_color": "#5c3d2e",
        "h1_deco_char": "✦",
        "h1_wave": True,
        "h2_color": "#7c4a3a",
        "h2_border_left": "5px solid #e0885a",
        "h2_dash_color": "#e8c8a0",
        "h3_color": "#8b5e3c",
        "h3_prefix": "✎",
        "strong_color": "#5c3d2e",
        "strong_border": "bottom:2px solid #e0885a",
        "em_bg": "#fde8d0",
        "em_color": "#6b3a2a",
        "code_color": "#8b4513",
        "code_bg": "#fef5eb",
        "code_border": "bottom:1px dotted #c9704a",
        "a_color": "#8b5e3c",
        "a_border": "1px dashed #c9704a",
        "blockquote_bg": "#fef5eb",
        "blockquote_border": "4px solid #e0885a",
        "blockquote_color": "#5c4332",
        "blockquote_icon": "📝",
        "code_block_bg": "#fef5eb",
        "code_block_border": "1px solid #e8c8a0",
        "code_block_text": "#4a3728",
        "code_block_label": "CODE",
        "code_block_label_color": "#c9704a",
        "table_border": "1px solid #e8c8a0",
        "th_bg": "#e8c8a0",
        "th_color": "#4a3728",
        "td_border": "1px solid #f0dcc8",
        "td_color": "#5c4332",
        "td_even_bg": "#fef9f0",
        "list_bullet_color": "#c9704a",
        "ol_num_color": "#8b5e3c",
        "hr_color": "#e8c8a0",
        "footer_color": "#c9704a",
        "footer_border": "1px dashed #e8c8a0",
        "cover_bg": "#fef5eb",
        "cover_text": "#5c3d2e",
        "cover_accent": "#e0885a",
    },
    "cyber": {
        "name": "赛博朋克霓虹风",
        "wrapper_bg": "#090b1a",
        "text_color": "#e8f7ff",
        "p_color": "#d7e8ff",
        "h1_color": "#00f5ff",
        "h1_deco_char": "✦",
        "h1_wave": True,
        "h2_color": "#ff2bd6",
        "h2_border_left": "5px solid #00f5ff",
        "h2_dash_color": "#ff2bd6",
        "h3_color": "#39ff14",
        "h3_prefix": "◆",
        "strong_color": "#ffffff",
        "strong_border": "bottom:2px solid #ffea00",
        "em_bg": "#23124d",
        "em_color": "#00f5ff",
        "code_color": "#39ff14",
        "code_bg": "#11142b",
        "code_border": "bottom:1px dotted #00f5ff",
        "a_color": "#00f5ff",
        "a_border": "1px dashed #ff2bd6",
        "blockquote_bg": "#12142d",
        "blockquote_border": "4px solid #ff2bd6",
        "blockquote_color": "#e8f7ff",
        "blockquote_icon": "💡",
        "code_block_bg": "#080a16",
        "code_block_border": "2px dashed #00f5ff",
        "code_block_text": "#d7e8ff",
        "code_block_label": "NEON CODE",
        "code_block_label_color": "#39ff14",
        "table_border": "1px solid #00f5ff",
        "th_bg": "#24104f",
        "th_color": "#00f5ff",
        "td_border": "1px dashed #28315f",
        "td_color": "#d7e8ff",
        "td_even_bg": "#10132b",
        "list_bullet_color": "#ff2bd6",
        "ol_num_color": "#00f5ff",
        "hr_color": "#ff2bd6",
        "footer_color": "#00f5ff",
        "footer_border": "1px dashed #ff2bd6",
        "cover_bg": "#090b1a",
        "cover_text": "#00f5ff",
        "cover_accent": "#ff2bd6",
    },
}


def load_config():
    config_path = os.path.expanduser("~/.wechat/config")
    if not os.path.exists(config_path):
        print("[ERROR] 未找到 ~/.wechat/config")
        sys.exit(1)
    config = {}
    with open(config_path) as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                config[k.strip()] = v.strip()
    return config["WECHAT_APPID"], config["WECHAT_APPSECRET"]


def get_access_token(appid, secret):
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "access_token" in data:
        print("  [OK] access_token 获取成功")
        return data["access_token"]
    print(f"  [ERROR] token 获取失败: {data}")
    if data.get("errcode") == 40164:
        print("    → IP 不在白名单")
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
        print(f"  [OK] 封面上传成功")
        return data["media_id"]
    print(f"  [ERROR] 封面上传失败: {data}")
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
        print(f"  [OK] 草稿创建成功, media_id: {data['media_id']}")
        return data["media_id"]
    print(f"  [ERROR] 草稿创建失败: {data}")
    sys.exit(1)


def delete_draft(access_token, media_id):
    url = f"https://api.weixin.qq.com/cgi-bin/draft/delete?access_token={access_token}"
    payload = json.dumps({"media_id": media_id}).encode("utf-8")
    req = urllib.request.Request(url, data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if data.get("errcode") == 0:
        print(f"  [OK] 已删除旧草稿: {media_id}")
        return True
    print(f"  [WARN] 旧草稿删除失败: {data}")
    return False


def validate_wechat_html(content):
    checks = [
        ("禁止 style 标签", r"<style|</style>"),
        ("禁止真实列表标签", r"<ul\b|</ul>|<ol\b|</ol>|<li\b|</li>"),
        ("禁止 position", r'style="[^"]*position\s*:'),
        ("禁止 box-shadow", r'style="[^"]*box-shadow\s*:'),
        ("禁止 border-radius", r'style="[^"]*border-radius\s*:'),
        ("禁止 gradient", r'style="[^"]*(linear-gradient|radial-gradient)'),
        ("禁止 rgba", r'style="[^"]*rgba\('),
        ("禁止 transform/animation/transition", r'style="[^"]*(transform|animation|transition)\s*:'),
        ("禁止 text-shadow", r'style="[^"]*text-shadow\s*:'),
        ("禁止 float/z-index", r'style="[^"]*(float|z-index)\s*:'),
    ]
    failures = []
    for label, pattern in checks:
        if re.search(pattern, content, flags=re.I):
            failures.append(label)
    if failures:
        print("  [ERROR] HTML 兼容性检查失败:")
        for failure in failures:
            print(f"    - {failure}")
        sys.exit(1)
    print("  [OK] HTML 兼容性检查通过")


def generate_cover(title, theme_key, output="cover.png", cover_main="", cover_subtitle=""):
    """生成 900x383 封面图，不同主题不同风格"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("  [WARN] PIL 未安装，生成纯色封面")
        return None

    t = THEMES[theme_key]
    bg_color = t["cover_bg"]
    accent = t["cover_accent"]
    text_color = t["cover_text"]

    img = Image.new('RGB', (900, 383), bg_color)
    draw = ImageDraw.Draw(img)

    # 主题装饰
    if theme_key == "minimal":
        # 简约: 细线顶部 + 底部
        draw.rectangle([60, 50, 840, 54], fill=accent)
        draw.rectangle([60, 330, 840, 334], fill=accent)
    elif theme_key == "tech":
        # 科技: 左侧竖条 + 点阵
        draw.rectangle([50, 60, 56, 323], fill=accent)
        for y in range(80, 320, 30):
            for x in range(70, 850, 30):
                draw.ellipse([x, y, x+4, y+4], fill=accent + "30")
    elif theme_key == "warm":
        # 暖色: 横线纹理
        for y in range(0, 383, 28):
            draw.line([(0, y), (900, y)], fill=accent + "40", width=1)
        draw.line([(50, 0), (50, 383)], fill=accent, width=2)
    elif theme_key == "cyber":
        # 赛博朋克: 大标题卡片式构图，减少干扰网格。
        draw.rectangle([42, 38, 858, 42], fill=accent)
        draw.rectangle([42, 342, 858, 346], fill="#00f5ff")
        draw.rectangle([42, 38, 46, 346], fill="#39ff14")
        draw.rectangle([854, 38, 858, 346], fill="#24104f")
        for x in range(92, 836, 92):
            draw.line([(x, 68), (x, 318)], fill="#131936", width=1)
        for y in range(80, 320, 58):
            draw.line([(72, y), (828, y)], fill="#131936", width=1)

    def load_font(size):
        font_paths = [
            "/System/Library/Fonts/STHeiti Medium.ttc",
            "/System/Library/Fonts/STHeiti Light.ttc",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/Supplemental/Songti.ttc",
        ]
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    try:
        font = load_font(42)
        large_font = load_font(72)
        medium_font = load_font(54)
        small_font = load_font(28)
    except Exception:
        font = ImageFont.load_default()
        large_font = font
        medium_font = font
        small_font = font

    def text_width(text, font_obj):
        box = draw.textbbox((0, 0), text, font=font_obj)
        return box[2] - box[0]

    def wrap_cjk(text, font_obj, max_width, max_lines=3):
        lines, current = [], ""
        for ch in text:
            candidate = current + ch
            if current and text_width(candidate, font_obj) > max_width:
                lines.append(current)
                current = ch
                if len(lines) == max_lines:
                    break
            else:
                current = candidate
        if current and len(lines) < max_lines:
            lines.append(current)
        return lines

    disp_title = title[:18]
    y_center = 160

    if theme_key == "minimal":
        draw.text((80, y_center), disp_title, fill=text_color, font=font)
        draw.text((80, y_center + 55), "技术文档 · 深度解析", fill=accent, font=small_font)
    elif theme_key == "tech":
        draw.text((80, y_center - 10), "◇", fill=accent, font=small_font)
        draw.text((80, y_center + 5), disp_title, fill=text_color, font=font)
        draw.text((80, y_center + 60), "AI · RAG · 智能检索", fill=accent, font=small_font)
    elif theme_key == "warm":
        draw.text((80, y_center - 10), "✦", fill=accent, font=small_font)
        draw.text((80, y_center + 5), disp_title, fill=text_color, font=font)
        draw.text((80, y_center + 60), "知识科普 · 轻松读懂", fill=accent, font=small_font)
    elif theme_key == "cyber":
        label = "CYBERPUNK WECHAT SKILL"
        if cover_main:
            main_1 = cover_main
        elif "公众号" in title and ("发布" in title or "排版" in title):
            main_1 = "公众号自动排版发布"
        else:
            main_1 = title[:12]
        main_2 = cover_subtitle or ("Claude Code" if "Claude Code" in title else "Markdown Skill")
        sub = "Markdown → Draft"

        label_w = text_width(label, small_font)
        main_1_w = text_width(main_1, large_font)
        main_2_w = text_width(main_2, medium_font)
        sub_w = text_width(sub, small_font)

        draw.text(((900 - label_w) / 2, 70), label, fill="#39ff14", font=small_font)
        draw.text(((900 - main_1_w) / 2, 118), main_1, fill=text_color, font=large_font)
        draw.text(((900 - main_2_w) / 2, 204), main_2, fill="#ffffff", font=medium_font)
        draw.rectangle([310, 290, 590, 294], fill=accent)
        draw.text(((900 - sub_w) / 2, 306), sub, fill=accent, font=small_font)

    img.save(output, 'PNG')
    print(f"  [OK] 封面图已生成: {output}")
    return output


# ============================================================
# Markdown → 微信兼容 HTML（支持主题参数）
# ============================================================

def inline_format(text, t):
    def repl_code(m):
        code = html_lib.escape(m.group(1), quote=False)
        return (
            f'<code style="color:{t["code_color"]};background-color:{t["code_bg"]};'
            f'padding:2px 6px;font-size:14px;border-{t["code_border"]};">{code}</code>'
        )

    text = re.sub(r'`([^`]+)`', repl_code, text)
    text = re.sub(r'\*\*([^*]+)\*\*',
        rf'<strong style="color:{t["strong_color"]};font-weight:700;'
        rf'border-{t["strong_border"]};padding-bottom:1px;">\1</strong>',
        text)
    text = re.sub(r'\*([^*]+)\*',
        rf'<em style="background-color:{t["em_bg"]};font-style:normal;'
        rf'padding:0 3px;color:{t["em_color"]};">\1</em>',
        text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',
        rf'<a href="\2" style="color:{t["a_color"]};text-decoration:none;'
        rf'border-bottom:{t["a_border"]};">\1</a>',
        text)
    return text


def md_to_wechat_html(md_text, theme_key):
    t = THEMES[theme_key]
    lines = md_text.strip().split("\n")
    html = []
    in_code, code_lines = False, []
    in_table, table_rows = False, []
    in_bq, bq_lines = False, []

    def format_code_block(raw_lines):
        if not raw_lines:
            raw_lines = [""]
        rendered_lines = []
        for raw in raw_lines:
            escaped = html_lib.escape(raw, quote=False)
            leading = len(escaped) - len(escaped.lstrip(" "))
            if leading:
                escaped = "&nbsp;" * leading + escaped[leading:]
            if escaped == "":
                escaped = "&nbsp;"
            rendered_lines.append(
                f'<p style="margin:0 0 4px 0;line-height:1.65;word-wrap:break-word;">'
                f'<code style="color:{t["code_block_text"]};font-size:13px;">{escaped}</code></p>'
            )
        return "".join(rendered_lines)

    def flush_bq():
        nonlocal in_bq, bq_lines
        if in_bq and bq_lines:
            inner = "".join(
                f'<p style="margin:4px 0;letter-spacing:0.5px;line-height:1.9;color:{t["blockquote_color"]};">{l}</p>'
                for l in bq_lines)
            icon_html = f'<p style="margin:0 0 6px 0;font-size:0.85em;">{t["blockquote_icon"]}</p>' if t["blockquote_icon"] else ""
            html.append(
                f'<blockquote style="background-color:{t["blockquote_bg"]};'
                f'border-left:{t["blockquote_border"]};'
                f'margin:1.5em 0;padding:12px 16px;font-size:15px;color:{t["blockquote_color"]};">'
                f'{icon_html}{inner}</blockquote>')
            bq_lines = []; in_bq = False

    def flush_table():
        nonlocal in_table, table_rows
        if in_table and table_rows:
            html.append(
                f'<table style="border-collapse:collapse;margin:1.4em auto;max-width:100%;'
                f'text-align:left;font-size:15px;border:{t["table_border"]};">')
            for i, row in enumerate(table_rows):
                cells = [c.strip() for c in row.split("|")[1:-1]]
                if i == 0:
                    html.append("<thead><tr>")
                    for cell in cells:
                        html.append(
                            f'<th style="background-color:{t["th_bg"]};color:{t["th_color"]};font-weight:700;'
                            f'padding:10px 14px;border-bottom:1px solid {t["th_bg"]};text-align:center;">'
                            f'{inline_format(cell, t)}</th>')
                    html.append("</tr></thead><tbody>")
                elif not all(set(c.strip()) <= set("-| ") for c in cells):
                    bg = f'background-color:{t["td_even_bg"]};' if i % 2 == 0 else ''
                    html.append("<tr>")
                    for cell in cells:
                        html.append(
                            f'<td style="padding:9px 14px;border-bottom:{t["td_border"]};'
                            f'color:{t["td_color"]};vertical-align:top;line-height:1.6;{bg}">'
                            f'{inline_format(cell, t)}</td>')
                    html.append("</tr>")
            html.append("</tbody></table>")
            table_rows = []; in_table = False

    for line in lines:
        s = line.strip()

        if s.startswith("```"):
            if in_code:
                ct = format_code_block(code_lines)
                html.append(
                    f'<section style="border:{t["code_block_border"]};margin:1.4em 0;padding:20px 16px 16px;'
                    f'font-size:13px;line-height:1.65;overflow-x:auto;background-color:{t["code_block_bg"]};">'
                    f'<p style="font-size:13px;color:{t["code_block_label_color"]};font-weight:700;margin:0 0 8px 0;">'
                    f'{t["code_block_label"]}</p>'
                    f'{ct}</section>')
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
            bq_lines.append(inline_format(s[2:], t))
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
                f'<p style="text-align:center;margin:2em 0;color:{t["hr_color"]};'
                f'font-size:15px;letter-spacing:6px;">· · · · · ·</p>')
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
            title = inline_format(h_match.group(2), t)
            if level == 1:
                deco = t["h1_deco_char"]
                html.append(
                    f'<h1 style="text-align:center;font-size:1.65em;font-weight:900;color:{t["h1_color"]};'
                    f'letter-spacing:1px;margin:1.2em 0 0.4em;padding:12px 20px;">'
                    f'{deco + " " if deco else ""}{title}</h1>')
                if t["h1_wave"]:
                    html.append(
                        f'<p style="text-align:center;font-size:15px;color:{t["cover_accent"]};'
                        f'letter-spacing:4px;margin:0 0 1em 0;">〰〰〰〰〰〰〰〰〰〰</p>')
                else:
                    html.append(
                        f'<p style="text-align:center;font-size:15px;color:{t["hr_color"]};'
                        f'letter-spacing:4px;margin:0 0 1em 0;">——</p>')
            elif level == 2:
                html.append(
                    f'<h2 style="font-size:1.3em;font-weight:700;color:{t["h2_color"]};'
                    f'margin:1.8em 0 0.4em;padding:6px 0 6px 12px;'
                    f'border-left:{t["h2_border_left"]};">{title}</h2>'
                    f'<p style="border-bottom:2px dashed {t["h2_dash_color"]};margin:0 0 0.8em 0;'
                    f'height:0;font-size:0;line-height:0;overflow:hidden;">-</p>')
            elif level == 3:
                prefix = t["h3_prefix"]
                html.append(
                    f'<h3 style="font-size:1.15em;font-weight:600;color:{t["h3_color"]};'
                    f'margin:1.4em 0 0.5em;padding-left:4px;">{prefix} {title}</h3>')
            else:
                html.append(
                    f'<h{level} style="font-size:1.1em;font-weight:600;color:{t["p_color"]};'
                    f'margin:1.2em 0 0.5em;">{title}</h{level}>')
            continue

        ul_match = re.match(r'^[-*]\s+(.+)', s)
        if ul_match:
            flush_bq(); flush_table()
            content = inline_format(ul_match.group(1), t)
            html.append(
                f'<p style="padding-left:24px;margin:0.35em 0;line-height:1.8;'
                f'letter-spacing:0.5px;color:{t["p_color"]};">'
                f'<span style="color:{t["list_bullet_color"]};">◦</span> {content}</p>')
            continue

        ol_match = re.match(r'^(\d+)\.\s+(.+)', s)
        if ol_match:
            flush_bq(); flush_table()
            num = ol_match.group(1)
            content = inline_format(ol_match.group(2), t)
            html.append(
                f'<p style="padding-left:24px;margin:0.35em 0;line-height:1.8;'
                f'letter-spacing:0.5px;color:{t["p_color"]};">'
                f'<strong style="color:{t["ol_num_color"]};font-weight:700;">{num}.</strong> {content}</p>')
            continue

        flush_bq(); flush_table()
        html.append(
            f'<p style="letter-spacing:0.5px;line-height:1.9;margin:0.8em 0;color:{t["p_color"]};">'
            f'{inline_format(s, t)}</p>')

    flush_bq(); flush_table()

    # footer
    html.append(
        f'<p style="text-align:center;margin-top:2em;padding-top:16px;'
        f'border-top:{t["footer_border"]};color:{t["footer_color"]};font-size:13px;">'
        f'· {t["name"]} ·</p>')

    content = "\n".join(html)
    wrapper = (
        f'<section style="line-height:1.85;font-size:16px;color:{t["text_color"]};'
        f'padding:20px 16px 30px;background-color:{t["wrapper_bg"]};">'
        f'{content}</section>')
    return wrapper


def main():
    parser = argparse.ArgumentParser(description="多主题微信公众号文章发布")
    parser.add_argument("--article", required=True, help="Markdown 文章路径")
    parser.add_argument("--title", required=True, help="文章标题前缀（会自动追加风格名）")
    parser.add_argument("--author", default="", help="作者")
    parser.add_argument("--digest", default="", help="摘要")
    parser.add_argument("--themes", default="minimal,tech,warm",
                        help="主题列表，逗号分隔: minimal,tech,warm,cyber")
    parser.add_argument("--cover-main", default="", help="封面主标题，留空时根据文章标题推断")
    parser.add_argument("--cover-subtitle", default="", help="封面副标题，留空时根据文章标题推断")
    parser.add_argument("--replace-media-id", default="", help="创建新草稿成功后删除指定旧草稿 media_id")
    args = parser.parse_args()

    theme_keys = [k.strip() for k in args.themes.split(",")]

    print("=" * 50)
    print("多主题微信公众号文章发布工具")
    print(f"主题: {', '.join(THEMES[k]['name'] for k in theme_keys)}")

    # 读取文章
    print("\n[1/5] 读取文章...")
    with open(args.article, "r", encoding="utf-8") as f:
        md_text = f.read()

    # 获取 token
    print("\n[2/5] 获取 access_token...")
    appid, secret = load_config()
    token = get_access_token(appid, secret)

    base = os.path.splitext(args.article)[0]

    for theme_key in theme_keys:
        t = THEMES[theme_key]
        theme_title = f"{args.title} | {t['name']}"
        print(f"\n{'='*50}")
        print(f"处理主题: {t['name']} ({theme_key})")
        print(f"标题: {theme_title}")

        # 生成 HTML
        print(f"  [3/5] 转换 HTML ({t['name']})...")
        html = md_to_wechat_html(md_text, theme_key)
        validate_wechat_html(html)
        preview_path = f"{base}-{theme_key}.html"
        with open(preview_path, "w", encoding="utf-8") as f:
            f.write(f'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>{theme_title}</title>'
                    f'</head><body style="margin:0;background:#f0f0f0;">'
                    f'<div style="max-width:420px;margin:20px auto;">{html}</div>'
                    f'</body></html>')
        print(f"    预览: {preview_path}")

        # 生成封面
        print(f"  [4/5] 生成封面图 ({t['name']})...")
        cover_path = f"{base}-{theme_key}-cover.png"
        cover = generate_cover(args.title, theme_key, cover_path, args.cover_main, args.cover_subtitle)
        if not cover:
            print("  [ERROR] 封面生成失败，跳过")
            continue

        # 上传封面 + 创建草稿
        print(f"  [5/5] 上传封面并创建草稿 ({t['name']})...")
        try:
            thumb_id = upload_thumb(token, cover)
            digest = args.digest or f"{args.title} — {t['name']}版"
            media_id = create_draft(token, theme_title, html, args.author or "AI Assistant", digest, thumb_id)
            print(f"  >>> 草稿创建完成! media_id: {media_id}")
            if args.replace_media_id:
                delete_draft(token, args.replace_media_id)
        except Exception as e:
            print(f"  [ERROR] 发布失败: {e}")
            continue

    print(f"\n{'='*50}")
    print("全部完成！请去微信公众平台草稿箱确认文章效果。")
    print("⚠️  AppSecret 如在对话中出现过，请尽快重置。")


if __name__ == "__main__":
    main()
