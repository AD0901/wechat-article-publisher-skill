# 十大领域来源计划

始终以项目 `config/domain-search-plan.json` 为最新清单。每个领域同时运行中文和英文检索，并记录命中数。

| 领域 | 优先国际来源 |
|---|---|
| 新能源与电力 | IEA、IRENA、DOE、NREL |
| 建筑 | IEA、UNEP、NREL、欧盟委员会 |
| 工业 | UNIDO、IEA、DOE、欧盟委员会 |
| 交通运输 | IEA、ICAO、IMO、NREL |
| 农业 | FAO、CGIAR、USDA |
| 数字化 | IEA、UNEP、NREL、JRC |
| 新材料 | IEA、NREL、DOE 国家实验室、JRC |
| 负碳技术 | IEA、DOE、UNEP、Mission Innovation |
| 水资源管理 | UN-Water、UNEP、FAO、世界银行 |
| 环保与循环经济 | UNEP、EEA、欧盟委员会 |

IEA、IRENA 等网站可能对普通脚本返回 403。这通常是反自动化策略，不代表国际网络不可用。此时使用搜索入口发现原文，再打开并核验原始页面；不要把 403 站点标记成已直接采集成功。

## 无外网时的降级顺序

1. 直接打开一级来源。
2. 使用可用的网页搜索或新闻检索工具定位原文。
3. 读取项目配置的授权 API、RSS、国际新闻中转源或 `GLOBAL_NEWS_FEED_URL`，再以原文标题、机构、日期和 URL 交叉核验。
4. 仍无法核验时标记为“不可访问/未核验”，不得入选。

不得把网络失败解释为“周末没有国际新闻”，也不得绕过登录、验证码、付费墙或网站访问控制。
