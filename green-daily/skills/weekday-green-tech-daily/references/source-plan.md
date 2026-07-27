# 全球来源与网络降级

始终以项目 `config/domain-search-plan.json` 和 `config/sources.json` 为最新来源清单。每个领域同时运行中文和英文检索。

| 领域 | 国际一级来源示例 |
|---|---|
| 新能源与电力 | IEA、IRENA、DOE、NREL |
| 建筑 | IEA、UNEP、NREL、欧盟委员会 |
| 工业 | UNIDO、IEA、DOE、欧盟委员会 |
| 交通运输 | IEA、ICAO、IMO、NREL |
| 农业 | FAO、CGIAR、USDA |
| 数字化 | IEA、UNEP、NREL、JRC |
| 新材料 | DOE 国家实验室、NREL、JRC |
| 负碳技术 | IEA、DOE、UNEP、Mission Innovation |
| 水资源管理 | UN-Water、UNEP、FAO、世界银行 |
| 环保与循环经济 | UNEP、EEA、欧盟委员会 |

## 无外网或站点阻拦时

按以下顺序降级：

1. 直接打开一级来源。
2. 使用可用的网页搜索或新闻检索工具定位原文。
3. 读取项目配置的授权 API、RSS、国际新闻中转源或 `GLOBAL_NEWS_FEED_URL`，再以原文标题、机构、日期和 URL 交叉核验。
4. 仍无法核验时标记为“不可访问/未核验”，不得入选。

IEA、IRENA 等站点可能返回 403。这通常是反自动化策略，不代表该机构没有新闻。记录实际失败，不伪装采集成功，也不绕过访问控制。
