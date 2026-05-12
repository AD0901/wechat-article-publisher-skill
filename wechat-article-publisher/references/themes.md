# 6 套视觉主题 — 微信 CSS 兼容完整定义

所有颜色值均为纯色 hex，适配微信公众号 CSS 白名单（内联样式、无渐变/阴影/圆角/定位）。

## 主题速查

| 主题 | 底色 | 强调色 | 适用场景 |
|------|------|--------|---------|
| **Maize** 柔和玉米 | `#fafafa` | `#E49123` 玉米金 | 个人复盘、踩坑分享 |
| **Mint** 物理猫-薄荷 | `#ffffff` | `#3db8bf` 薄荷青 | 技术教程、工具推荐 |
| **Rainbow** 彩虹 | `#ffffff` | 多色点缀 | 温暖分享、轻松话题 |
| **Slate** 岩灰 | `#f8f9fa` | `#7f8c8d` 岩灰 | 深度分析、行业判断 |
| **Ink** 墨韵 | `#fdfcf9` | `#c9a96e` 金褐 | 哲学思考、东方美学 |
| **Electric** 电光蓝 | `#ffffff` | `#0059ff` 电光蓝 | 前沿趋势、颠覆观点 |

---

## 1. Maize · 柔和玉米

灵感：BEATREE/typora-maize-theme（玉米黄暖纸色，柔和阅读感）

| 元素 | CSS |
|------|-----|
| 底色 | `background-color:#fafafa` |
| 文字 | `color:#333333` |
| H1 | `color:#1a1a1a;font-weight:900;text-align:center` |
| H1 下装饰 | `color:#ffb11b`（`———` 或 `〰〰〰`） |
| H2 | `color:#333333;border-left:4px solid #ffb11b;padding-left:12px` |
| H3 | `color:#4a4a4a;font-weight:600` |
| 加粗 strong | `color:#E49123;font-weight:700;border-bottom:2px solid #ffb11b` |
| 荧光笔 em | `background-color:#fff9f9;font-style:normal;padding:0 3px` |
| 行内代码 code | `color:#c0392b;background-color:#f0f0f0;padding:2px 6px` |
| 代码块 | 底色 `#f0f0f0`，边框 `1px solid #ccc` |
| 引用块 blockquote | `background-color:#fff9f9;border-left:3px solid #ffb11b;color:#6a737d` |
| 表格 th | `background-color:#f0f0f0;color:#333` |
| 表格 td | `background-color:#ffffff`，偶数行 `#F8F8F8` |
| 表格边框 | `border:1px solid #ccc` |
| 有序列表序号 | `color:#E49123;font-weight:700` |
| 无序列表符号 | `color:#ffb11b` |
| 分割线 | `color:#b8a88a`（`· · · ✦ · · ·`） |
| 链接 a | `color:#E49123;border-bottom:1px dashed #E49123` |

---

## 2. Mint · 物理猫-薄荷

灵感：sumruler/typora-theme-phycat mint（薄荷青克制配色，层级分明）

| 元素 | CSS |
|------|-----|
| 底色 | `background-color:#ffffff` |
| 文字 | `color:#333333` |
| H1 | `color:#1a1a1a;font-weight:900;text-align:center` |
| H1 下装饰 | `color:#3db8bf`（`———`） |
| H2 | `color:#1a1a2e;border-left:4px solid #3db8bf;padding-left:12px` |
| H2 下划线 | `border-bottom:2px dashed #7aeaf0` |
| H3 | `color:#089ba3;font-weight:600` |
| 加粗 strong | `color:#089ba3;font-weight:700` |
| 荧光笔 em | `background-color:#7aeaf018;font-style:normal;padding:0 3px;color:#333` |
| 行内代码 code | `color:#089ba3;background-color:#7aeaf018;padding:2px 6px;border-bottom:1px dotted #3db8bf` |
| 代码块 | 底色 `#f8fafa`，边框 `2px dashed #3db8bf` |
| 引用块 blockquote | `background-color:#f0fafa;border-left:3px solid #3db8bf;color:#4a5a5a` |
| 表格 th | `background-color:#e8f5f5;color:#333;border-bottom:2px solid #3db8bf` |
| 表格 td | 偶数行 `background-color:#f5fafa` |
| 表格边框 | `border:1px solid #b8d8d8` |
| 有序列表序号 | `color:#3db8bf;font-weight:700` |
| 无序列表符号 | `color:#7aeaf0` |
| 分割线 | `color:#7aeaf0`（`· · · ✦ · · ·`） |
| 链接 a | `color:#089ba3;border-bottom:1px dashed #3db8bf` |

---

## 3. Rainbow · 彩虹

灵感：thezbm/typora-theme-rainbow（暖色调多色点缀，干净整洁）

| 元素 | CSS |
|------|-----|
| 底色 | `background-color:#ffffff` |
| 文字 | `color:#1a1a1a` |
| H1 | `color:#1a1a1a;font-weight:900;text-align:center` |
| H2 | `background-color:#ffe8e8;border-left:4px solid #ffbfbf;color:#333;padding:8px 14px` |
| H3 | `color:#4a4a4a;font-weight:600;text-decoration:underline;text-decoration-color:#ffbfbf` |
| 加粗 strong | `color:#1a1a1a;font-weight:700` |
| 荧光笔 em/mark | `background-color:#fcffc8;font-style:normal;padding:0 3px` |
| 行内代码 code | `background-color:#f7f7f7;padding:2px 6px;color:#c0392b` |
| 代码块 | 底色 `#f7f7f7`，边框 `1px solid #e0e0e0` |
| 引用块 blockquote | `color:#666;border-left:3px solid #a9caff` |
| 表格 th | `background-color:#fff3e4;border-bottom:2px solid #ffe0c0` |
| 表格 td | 偶数行 `background-color:#fff9f2`，hover `#feffe6` |
| 表格边框 | `border:1px solid #ffebd3` |
| 有序列表序号 | `color:#ff6b6b;font-weight:700` |
| 无序列表符号 | `color:#ffbfbf` |
| 分割线 | `color:#e2e2e2` |
| 链接 a | `color:#1f75ff` |

---

## 4. Slate · 岩灰

灵感：Nord/Base16 灰阶体系（极简高级灰，专业克制）

| 元素 | CSS |
|------|-----|
| 底色 | `background-color:#f8f9fa` |
| 文字 | `color:#2c3e50` |
| H1 | `color:#1a1a2e;font-weight:900;text-align:center;border-bottom:2px solid #dee2e6;padding-bottom:12px` |
| H2 | `color:#34495e;border-left:4px solid #7f8c8d;padding-left:12px` |
| H3 | `color:#2c3e50;font-weight:600` |
| 加粗 strong | `color:#1a1a2e;font-weight:700;border-bottom:2px solid #bdc3c7` |
| 荧光笔 em | `background-color:#ecf0f1;font-style:normal;padding:0 3px` |
| 行内代码 code | `color:#e74c3c;background-color:#ecf0f1;padding:2px 6px` |
| 代码块 | 底色 `#ecf0f1`，边框 `1px solid #dee2e6` |
| 引用块 blockquote | `background-color:#f2f3f5;border-left:3px solid #95a5a6;color:#5a6a7a` |
| 表格 th | `background-color:#e9ecef;color:#2c3e50` |
| 表格 td | 偶数行 `background-color:#f8f9fa` |
| 表格边框 | `border:1px solid #dee2e6` |
| 有序列表序号 | `color:#7f8c8d;font-weight:700` |
| 无序列表符号 | `color:#95a5a6` |
| 分割线 | `color:#bdc3c7` |
| 链接 a | `color:#2980b9;border-bottom:1px dashed #2980b9` |

---

## 5. Ink · 墨韵

灵感：东方书法/宣纸美学（暖白底、墨色字、金褐点缀）

| 元素 | CSS |
|------|-----|
| 底色 | `background-color:#fdfcf9` |
| 文字 | `color:#3a3a3a` |
| H1 | `color:#1a1a1a;font-weight:900;text-align:center` |
| H1 下装饰 | `color:#c9a96e`（`———`） |
| H2 | `color:#4a4a4a;border-left:4px solid #c9a96e;padding-left:12px` |
| H3 | `color:#5a5a5a;font-weight:600` |
| 加粗 strong | `color:#8b4513;font-weight:700;border-bottom:2px solid #d4b896` |
| 荧光笔 em | `background-color:#faf3e8;font-style:normal;padding:0 3px` |
| 行内代码 code | `color:#c0392b;background-color:#f5f0e8;padding:2px 6px` |
| 代码块 | 底色 `#f5f0e8`，边框 `1px solid #d4c8b0` |
| 引用块 blockquote | `background-color:#faf7f2;border-left:3px solid #c9a96e;color:#5a5040` |
| 表格 th | `background-color:#f0ebe0;color:#3a3a3a;border-bottom:2px solid #c9a96e` |
| 表格 td | 偶数行 `background-color:#fdfaf5` |
| 表格边框 | `border:1px solid #d4c8b0` |
| 有序列表序号 | `color:#c9a96e;font-weight:700` |
| 无序列表符号 | `color:#b8976e` |
| 分割线 | `color:#c9a96e`（`· · · — · · ·`） |
| 链接 a | `color:#8b6914;border-bottom:1px dashed #c9a96e` |

---

## 6. Electric · 电光蓝

灵感：现代科技品牌色体系（纯白底、电光蓝强调、极致对比）

| 元素 | CSS |
|------|-----|
| 底色 | `background-color:#ffffff` |
| 文字 | `color:#1a1a2e` |
| H1 | `color:#0059ff;font-weight:900;text-align:center;border-bottom:2px solid #0059ff;padding-bottom:10px` |
| H2 | `color:#1a1a2e;border-left:4px solid #0059ff;padding-left:12px` |
| H3 | `color:#1a1a2e;font-weight:700` |
| 加粗 strong | `color:#0059ff;font-weight:700;border-bottom:2px solid #0050e0` |
| 荧光笔 em | `background-color:#f0f5ff;font-style:normal;padding:0 3px;color:#1a1a2e` |
| 行内代码 code | `color:#e74c3c;background-color:#f4f6fa;padding:2px 6px` |
| 代码块 | 底色 `#f4f6fa`，边框 `2px solid #0059ff` |
| 引用块 blockquote | `background-color:#f0f5ff;border-left:3px solid #0059ff;color:#334` |
| 表格 th | `background-color:#e8edf8;color:#1a1a2e;border-bottom:2px solid #0059ff` |
| 表格 td | 偶数行 `background-color:#f8faff` |
| 表格边框 | `border:1px solid #d0d8f0` |
| 有序列表序号 | `color:#0059ff;font-weight:700` |
| 无序列表符号 | `color:#3366ff` |
| 分割线 | `color:#d0d8f0` |
| 链接 a | `color:#0059ff;border-bottom:1px dashed #0059ff` |

---

## 主题匹配决策树

```
文章分析结果
│
├── 第一人称密度高 + 故事线索
│   ├── 情绪温暖/轻松 → Rainbow 彩虹
│   └── 情绪诚恳/自省 → Maize 玉米
│
├── 第一人称密度低 + 论证链长
│   ├── 东方/人文/哲学 → Ink 墨韵
│   └── 西方/分析/商业 → Slate 岩灰
│
├── 技术术语密集 + 步骤/表格多
│   ├── 实操教程/工具推荐 → Mint 薄荷
│   └── 前沿趋势/硬核技术 → Electric 电光蓝
│
└── 断言密度高 + 态度鲜明
    ├── 颠覆性/革命性 → Electric 电光蓝
    └── 深度反思/内省 → Ink 墨韵
```

## 匹配度计算逻辑

每个主题对文章特征打分（0-100），加权平均后排序：

1. 话题领域匹配（30%权重）
2. 情绪调性匹配（25%权重）
3. 角色定位匹配（20%权重）
4. 语言密度匹配（15%权重）
5. 历史偏好（10%权重，首次使用按默认值）

推荐 Top 1 为「推荐主题」，Top 2 为「备选」。
