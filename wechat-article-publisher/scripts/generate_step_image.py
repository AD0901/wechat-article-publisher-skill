#!/usr/bin/env python3
"""
Generate a WeChat article image with StepFun Step Plan step-image-edit-2.

This helper is intentionally small and dependency-free so the skill can use
StepFun as a secondary AI image path after gpt-image-2 and before HTML renders.
"""

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request


DEFAULT_BASE_URL = "https://api.stepfun.com/step_plan/v1"
DEFAULT_MODEL = "step-image-edit-2"
PROMPT_LIMIT = 512
DEFAULT_SIZES = {
    # StepFun documents step-image-edit-2 sizes as height x width.
    "body": "896x1184",
    "cover": "768x1360",
}


def build_api_key_guidance(api_key_env="STEP_API_KEY"):
    return (
        f"{api_key_env} is not set.\n"
        "To use StepFun step-image-edit-2, open the StepFun Platform, "
        "subscribe to Step Plan, create your own API key, then configure it "
        "only in your local environment:\n\n"
        f'export {api_key_env}="your_stepfun_api_key"\n\n'
        f"This skill uses the Step Plan base URL: {DEFAULT_BASE_URL}\n"
        "Check setup without consuming image quota:\n"
        "python3 scripts/generate_step_image.py --check-env\n"
    )


def build_generation_payload(
    prompt,
    mode,
    size=None,
    steps=8,
    cfg_scale=1.0,
    seed=None,
    text_mode=True,
    negative_prompt=None,
):
    prompt = prompt.strip()
    if not prompt:
        raise ValueError("prompt must not be empty")
    if len(prompt) > PROMPT_LIMIT:
        raise ValueError(
            f"step-image-edit-2 prompt is {len(prompt)} chars; "
            f"maximum is {PROMPT_LIMIT}"
        )
    if mode not in DEFAULT_SIZES:
        raise ValueError(f"mode must be one of: {', '.join(DEFAULT_SIZES)}")
    if not 1 <= steps <= 50:
        raise ValueError("steps must be between 1 and 50")
    if not 1.0 <= cfg_scale <= 10.0:
        raise ValueError("cfg_scale must be between 1.0 and 10.0")
    if seed is not None and not 0 <= seed <= 2147483647:
        raise ValueError("seed must be between 0 and 2147483647")
    if negative_prompt and len(negative_prompt) > PROMPT_LIMIT:
        raise ValueError(
            f"negative_prompt is {len(negative_prompt)} chars; "
            f"maximum is {PROMPT_LIMIT}"
        )

    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "response_format": "b64_json",
        "size": size or DEFAULT_SIZES[mode],
        "cfg_scale": cfg_scale,
        "steps": steps,
        "text_mode": bool(text_mode),
    }
    if seed is not None:
        payload["seed"] = seed
    if negative_prompt:
        payload["negative_prompt"] = negative_prompt
    return payload


def request_generation(payload, api_key, base_url=DEFAULT_BASE_URL, timeout=300):
    endpoint = f"{base_url.rstrip('/')}/images/generations"
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"StepFun HTTP {exc.code}: {body}") from exc


def write_image_from_response(response, out_path):
    data = response.get("data") or []
    if not data:
        raise RuntimeError(f"StepFun response has no image data: {response}")

    image = data[0]
    finish_reason = image.get("finish_reason")
    if finish_reason and finish_reason != "success":
        raise RuntimeError(f"StepFun generation did not succeed: {finish_reason}")

    if image.get("b64_json"):
        image_bytes = base64.b64decode(image["b64_json"])
    elif image.get("url"):
        with urllib.request.urlopen(image["url"], timeout=120) as response_url:
            image_bytes = response_url.read()
    else:
        raise RuntimeError(f"StepFun response has neither b64_json nor url: {image}")

    with open(out_path, "wb") as file:
        file.write(image_bytes)

    if os.path.getsize(out_path) == 0:
        raise RuntimeError(f"StepFun wrote an empty image: {out_path}")


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Generate a WeChat image via StepFun step-image-edit-2"
    )
    parser.add_argument("--prompt")
    parser.add_argument("--out", help="Output image path. Required unless --dry-run.")
    parser.add_argument("--mode", choices=sorted(DEFAULT_SIZES), default="body")
    parser.add_argument("--size", help="Override StepFun size, e.g. 896x1184")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--cfg-scale", type=float, default=1.0)
    parser.add_argument("--seed", type=int)
    parser.add_argument("--negative-prompt")
    parser.add_argument(
        "--no-text-mode",
        action="store_true",
        help="Disable text_mode. Keep enabled for Chinese labels by default.",
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--api-key-env", default="STEP_API_KEY")
    parser.add_argument("--timeout", type=int, default=300)
    parser.add_argument(
        "--check-env",
        action="store_true",
        help="Check whether the StepFun API key environment variable is set.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the request payload instead of calling StepFun.",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    if args.check_env:
        if os.environ.get(args.api_key_env):
            print(
                json.dumps(
                    {
                        "ok": True,
                        "api_key_env": args.api_key_env,
                        "base_url": args.base_url,
                        "model": DEFAULT_MODEL,
                    },
                    ensure_ascii=False,
                )
            )
            return 0
        print(build_api_key_guidance(args.api_key_env), file=sys.stderr)
        return 2

    if not args.prompt:
        raise SystemExit("--prompt is required unless --check-env is used")

    payload = build_generation_payload(
        prompt=args.prompt,
        mode=args.mode,
        size=args.size,
        steps=args.steps,
        cfg_scale=args.cfg_scale,
        seed=args.seed,
        text_mode=not args.no_text_mode,
        negative_prompt=args.negative_prompt,
    )

    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    if not args.out:
        raise SystemExit("--out is required unless --dry-run is used")

    api_key = os.environ.get(args.api_key_env)
    if not api_key:
        raise SystemExit(build_api_key_guidance(args.api_key_env))

    response = request_generation(
        payload,
        api_key=api_key,
        base_url=args.base_url,
        timeout=args.timeout,
    )
    write_image_from_response(response, args.out)
    print(json.dumps({"out": args.out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
