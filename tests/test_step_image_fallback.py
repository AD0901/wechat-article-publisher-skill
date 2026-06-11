import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_PATH = ROOT / "wechat-article-publisher" / "SKILL.md"
README_PATH = ROOT / "README.md"
THEMES_PATH = ROOT / "wechat-article-publisher" / "references" / "themes.md"
SCRIPT_PATH = ROOT / "wechat-article-publisher" / "scripts" / "generate_step_image.py"


def load_step_script():
    assert SCRIPT_PATH.exists(), "StepFun image generation helper script is missing"
    spec = importlib.util.spec_from_file_location("generate_step_image", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class StepImageFallbackTests(unittest.TestCase):
    def test_step_helper_uses_step_plan_defaults(self):
        module = load_step_script()
        payload = module.build_generation_payload(
            prompt="为公众号文章生成一张中文可读的信息图",
            mode="body",
            seed=1,
        )

        self.assertEqual(module.DEFAULT_BASE_URL, "https://api.stepfun.com/step_plan/v1")
        self.assertEqual(payload["model"], "step-image-edit-2")
        self.assertEqual(payload["response_format"], "b64_json")
        self.assertEqual(payload["cfg_scale"], 1.0)
        self.assertEqual(payload["steps"], 8)
        self.assertEqual(payload["seed"], 1)
        self.assertIs(payload["text_mode"], True)

    def test_step_helper_selects_safe_default_sizes(self):
        module = load_step_script()

        body_payload = module.build_generation_payload(
            prompt="正文配图，中文标签清晰",
            mode="body",
        )
        cover_payload = module.build_generation_payload(
            prompt="公众号封面，主标题清晰",
            mode="cover",
        )

        self.assertEqual(body_payload["size"], "896x1184")
        self.assertEqual(cover_payload["size"], "768x1360")

    def test_docs_define_stepfun_as_secondary_image_model(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")
        readme_text = README_PATH.read_text(encoding="utf-8")

        for text in (skill_text, readme_text):
            self.assertIn("step-image-edit-2", text)
            self.assertIn("https://api.stepfun.com/step_plan/v1", text)
            self.assertIn("STEP_API_KEY", text)

        self.assertIn("gpt-image-2 → step-image-edit-2 → HTML", skill_text)
        self.assertIn("gpt-image-2 → step-image-edit-2 → HTML", readme_text)

    def test_step_helper_explains_first_use_api_key_setup(self):
        module = load_step_script()
        message = module.build_api_key_guidance("STEP_API_KEY")

        self.assertIn("STEP_API_KEY", message)
        self.assertIn("Step Plan", message)
        self.assertIn("https://api.stepfun.com/step_plan/v1", message)
        self.assertIn("export STEP_API_KEY", message)
        self.assertIn("--check-env", message)


class SkillRetroRulesTests(unittest.TestCase):
    def test_skill_documents_rich_layout_component_library(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")

        for phrase in (
            "章节标题徽章",
            "分层架构卡片",
            "功能亮点卡片",
            "通用分点卡片",
            "步骤卡片",
            "成熟度分级卡",
            "双栏对比布局",
            "分点分级方式",
            "信息/警告/建议盒子",
            "不是用户旅程或趋势的专属格式",
        ):
            self.assertIn(phrase, skill_text)

    def test_skill_documents_new_wechat_rendering_rules(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")

        for phrase in (
            "<< 'ENDOFSCRIPT'",
            "禁用 HTML 数字实体",
            "真实 UTF-8 字符",
            "对比度检查",
            "背景色 + 文字色",
            "动态获取要删除的 media_id",
            "禁止硬编码 OLD_DRAFT",
            "/bin/bash",
            "exit 127",
            "cd /tmp && npm install playwright",
        ):
            self.assertIn(phrase, skill_text)

    def test_readme_summarizes_operational_lessons(self):
        readme_text = README_PATH.read_text(encoding="utf-8")

        for phrase in (
            "富排版组件库",
            "通用分点卡片",
            "bash heredoc",
            "真实 UTF-8 字符",
            "对比度检查",
            "动态获取旧草稿",
            "Playwright 模块找不到",
        ):
            self.assertIn(phrase, readme_text)


class MinimalPremiumThemeSystemTests(unittest.TestCase):
    def test_theme_reference_defines_capsule_system_and_dedup_rules(self):
        themes_text = THEMES_PATH.read_text(encoding="utf-8")

        for phrase in (
            "极简高级基底",
            "风格胶囊",
            "背景语法",
            "组件密度",
            "图像气质",
            "轻量反重复检查",
            "旧主题兼容映射",
            "Gallery White",
            "Mist Report",
            "Warm Paper",
            "Mono Margin",
            "Quiet Tech",
            "Dark Editorial",
        ):
            self.assertIn(phrase, themes_text)

    def test_skill_recommends_visual_plan_not_fixed_theme_only(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")

        for phrase in (
            "极简高级基底 + 风格胶囊",
            "轻量反重复",
            "推荐视觉方案",
            "背景语法",
            "主强调色和弱辅助色",
            "组件密度",
            "图像气质和封面构图",
            "避免连续使用相同背景、强调色、组件组合和封面构图",
        ):
            self.assertIn(phrase, skill_text)

    def test_readme_summarizes_premium_visual_capsules(self):
        readme_text = README_PATH.read_text(encoding="utf-8")

        for phrase in (
            "极简高级视觉系统",
            "6 个风格胶囊",
            "轻量反重复机制",
            "Gallery White",
            "Mist Report",
            "Warm Paper",
            "Quiet Tech",
            "旧版 Maize、Mint、Rainbow、Slate、Ink、Electric 仅作为兼容别名保留",
        ):
            self.assertIn(phrase, readme_text)

    def test_docs_do_not_require_old_generate_wechat_theme_skill(self):
        combined_text = "\n".join(
            (
                SKILL_PATH.read_text(encoding="utf-8"),
                README_PATH.read_text(encoding="utf-8"),
            )
        )

        self.assertIn("不要再额外安装旧版 `generate-wechat-theme` 目录", combined_text)
        self.assertIn("基础静态封面", combined_text)
        self.assertNotIn("~/.claude/skills/generate-wechat-theme", combined_text)
        self.assertNotIn("@generate-wechat-theme", combined_text)
        self.assertNotIn("需要同时安装依赖技能 `generate-wechat-theme`", combined_text)
