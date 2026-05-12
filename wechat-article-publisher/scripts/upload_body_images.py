#!/usr/bin/env python3
"""
Upload article body images to WeChat CDN.
Body images use media/uploadimg (NOT material/add_material).
Returns CDN URLs that can be directly embedded in article HTML.

Usage:
  python3 upload_body_images.py <image1.png> <image2.png> ...

Output: JSON mapping filename -> wechat_url
"""

import json
import os
import sys
import urllib.request


def get_access_token(config_path="~/.wechat/config"):
    """Read WeChat credentials and get access token."""
    config_path = os.path.expanduser(config_path)
    config = {}
    with open(config_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                config[k.strip()] = v.strip()

    url = (
        f"https://api.weixin.qq.com/cgi-bin/token"
        f"?grant_type=client_credential"
        f"&appid={config['WECHAT_APPID']}"
        f"&secret={config['WECHAT_APPSECRET']}"
    )
    resp = json.loads(urllib.request.urlopen(url).read())
    if 'access_token' not in resp:
        raise RuntimeError(f"Failed to get access_token: {resp}")
    return resp['access_token']


def upload_image(token, filepath):
    """Upload a single image to WeChat content CDN.

    Returns: {"url": "http://mmbiz.qpic.cn/..."}

    NOTE: Uses media/uploadimg (for article body images), NOT
    material/add_material (for permanent/cover images).
    """
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        file_data = f.read()

    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
        f'Content-Type: image/png\r\n\r\n'
    ).encode() + file_data + f'\r\n--{boundary}--\r\n'.encode()

    url = f'https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token={token}'
    req = urllib.request.Request(url, data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

    resp = json.loads(urllib.request.urlopen(req).read())
    if 'url' not in resp:
        raise RuntimeError(f"Image upload failed for {filename}: {resp}")
    return resp['url']


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <image1.png> [image2.png ...]")
        print("Uploads article body images to WeChat CDN.")
        print("Returns JSON mapping filename -> wechat_url")
        sys.exit(1)

    token = get_access_token()
    results = {}

    for filepath in sys.argv[1:]:
        if not os.path.exists(filepath):
            print(f"  [SKIP] File not found: {filepath}", file=sys.stderr)
            continue

        try:
            url = upload_image(token, filepath)
            key = os.path.splitext(os.path.basename(filepath))[0]
            results[key] = url
            print(f"  [OK] {os.path.basename(filepath)} -> {url[:60]}...",
                  file=sys.stderr)
        except Exception as e:
            print(f"  [ERROR] {filepath}: {e}", file=sys.stderr)

    # Output JSON to stdout for piping
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
