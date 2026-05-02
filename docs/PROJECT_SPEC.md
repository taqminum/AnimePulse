# 项目说明（评审版）

## 1. 运行方式

### 1.1 本地开发

1. 安装依赖

```bash
npm i
```

2. 配置环境变量（二选一）

- 演示模式（不需要任何配置）：直接跳过
- 真实 AI 模式：在项目根目录创建 `.env.local`，并写入：

```txt
AI_API_KEY=你的 DeepSeek Key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-v4-flash

# 可选：生产环境共享缓存/限流
UPSTASH_REDIS_REST_URL=你的 Upstash REST URL
UPSTASH_REDIS_REST_TOKEN=你的 Upstash REST Token

# 可选：运维指标接口令牌
METRICS_TOKEN=你的随机令牌
```

`.env.local` 已被 `.gitignore` 忽略，真实 Key 只应放在本地环境或部署平台环境变量中，不要提交到 Git。

3. 启动

```bash
npm run dev
```

4. 提交或部署前检查

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

也可以一次性执行：

```bash
npm run check
```

GitHub Actions 会在 `main` 分支 push 和 pull request 时自动运行同样的质量门禁。

### 1.2 线上部署（推荐 Vercel）

推荐方式：把仓库推到 Git 平台（如 GitHub/GitLab），再在 Vercel 新建项目并导入该仓库，然后在 Project Settings → Environment Variables 中配置：

- `AI_API_KEY`（真实调用必须）
- `AI_BASE_URL`（可选；默认 `https://api.deepseek.com/v1`，用于兼容 OpenAI-compatible 网关/代理）
- `AI_MODEL`（可选；默认 `deepseek-v4-flash`）
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`（可选；用于生产环境共享缓存和限流）
- `METRICS_TOKEN`（可选；用于启用并保护 `GET /api/metrics`）

部署后可通过以下方式确认 AI 能否在生产环境正常调用：

- 交互验证：在页面打开番剧详情，触发“AI 深度洞察”并观察返回是否为真实结构化内容
- API 探针：访问 `GET /api/ai-health?probe=1`（成功会返回 `ok: true` 与延迟）

如果你不想走 Git 平台导入，也可以使用 Vercel CLI 部署；但需要先在本地登录或配置 Vercel Token。

## 1.3 评审指引（建议给评审同学的检查路径）

1. 打开首页，等待番剧列表加载完成
2. 查看每个条目的“一句话摘要”是否正常展示
3. 点击任意番剧进入详情，触发“AI 深度洞察”
4. 检查洞察输出是否包含：`weighted_score`、`consensus`、`highlights`、`expert_opinions`、`trend`
5. （可选）访问 `GET /api/ai-health?probe=1`，确认生产环境到 AI 的链路可用

## 2. AI 调用是否会上线后失效？

本项目的 AI Key 仅在服务端使用：浏览器只调用站内 API（`/api/*`），由服务端再去请求 DeepSeek 兼容接口。因此上线后是否可用主要取决于：

- 部署平台是否注入了正确的 `AI_API_KEY`
- 部署区域到 `AI_BASE_URL` 的出网是否可达（如果被网络/地域限制，可改用自建/第三方 OpenAI-compatible 网关，并通过 `AI_BASE_URL` 指向它）
- Key 配额/模型权限是否满足请求的模型（默认 `deepseek-v4-flash`）

## 3. 关键数据流

### 3.1 一句话摘要（列表页）

1. 前端请求 `POST /api/anime-summaries` 传入番剧条目
2. 服务端先请求 Bangumi 获取完整简介
3. 若配置了 `AI_API_KEY`：调用 DeepSeek 兼容接口生成一句话摘要；否则对简介做截断返回

### 3.2 AI 深度洞察（详情弹窗）

1. 前端请求 `POST /api/anime-insight` 传入番剧名
2. 服务端抓取 B 站搜索结果（优先“评价/锐评”等关键词与头部 UP）
3. 若配置了 `AI_API_KEY`：将搜索结果作为上下文，让 LLM 生成结构化 JSON；否则返回演示用 Mock

## 4. API 列表（评审用）

- `POST /api/anime-summaries`
  - 入参：`{ animeItems: Array<{ id: number, ... }> }`
  - 出参：`{ summaries: Array<{ id: number, summary: string }> }`
- `POST /api/anime-insight`
  - 入参：`{ animeName: string }`
  - 出参：结构化洞察（`weighted_score`、`consensus`、`highlights`、`expert_opinions`、`trend`）+ `references`
- `GET /api/ai-health`
  - `probe=0`（默认）：仅返回是否配置 Key
  - `probe=1`：执行一次极小成本的 AI 请求以验证可用性

## 5. 已知限制

- B 站搜索结果受网络环境、反爬策略影响，可能偶发为空；Demo 会在此情况下退化为“数据不足”的输出
- 未配置 `AI_API_KEY` 时，AI 输出为 Mock/截断，适用于评审演示但不代表真实效果
- 未配置 Redis 时，缓存与限流是服务端内存级实现，适合单实例和轻量部署；配置 Upstash Redis 后可跨实例共享
- AI 输出会做结构归一化，避免模型返回缺字段时导致页面崩溃，但不保证内容事实完全准确
- `/api/metrics` 只记录当前服务进程内的轻量指标；多实例聚合、长期留存和告警建议后续接入专业监控服务
