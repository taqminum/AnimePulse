# AnimePulse（AI 番剧舆情与热度洞察）

AnimePulse 是一个 AI 番剧舆情与热度洞察工具：输入/浏览番剧列表后，它会聚合 Bangumi 与 Bilibili 公开线索，并用 DeepSeek 生成“极简一句话摘要”和“深度洞察”，帮助快速判断一部番剧的核心设定、社区共识与口碑趋势。

## 解决的问题

- 评审/汇报时，快速让非二次元受众理解番剧设定与卖点
- 在缺少内部数据的场景下，用公开信息做“舆情线索收集 + AI 汇总”

## 核心能力

- 番剧列表：基于 Bangumi 数据源展示番剧条目
- 一句话摘要：对 Bangumi 简介做 20 字以内的吸引型摘要
- AI 深度洞察：基于 B 站搜索结果（优先头部 UP/KOL）生成结构化分析（加权评分、共识、亮点、专家观点、走势）
- 演示模式：未配置 `AI_API_KEY` 时，不调用外部 AI，返回可用的 Mock/截断结果，确保评审可跑通完整交互

## 技术概览

- Web 框架：Next.js（App Router，Route Handlers）
- 前端：React
- 数据访问：`axios`
- AI：OpenAI-compatible SDK 接入 DeepSeek（服务端调用，Key 不下发浏览器）
- 运营保护：Redis/内存缓存、简单限流、AI 输出结构归一化、受保护的轻量指标接口
