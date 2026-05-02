# AnimePulse（AI 番剧舆情与热度洞察）

AnimePulse 是一个 AI 番剧舆情与热度洞察工具，聚合 Bangumi 与 Bilibili 公开线索，通过 DeepSeek 生成摘要、趋势、共识与参考来源。

## 本地运行

```bash
npm i
npm run dev
```

浏览器打开 `http://localhost:3000`。

## AI 配置

本项目默认支持“演示模式”：不配置 Key 也能跑通完整交互（会返回 Mock/截断结果）。

如需开启真实 AI 调用，在项目根目录创建 `.env.local`。不要把 `.env.local` 或真实 Key 提交到 Git：

```txt
AI_API_KEY=你的 DeepSeek Key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-v4-flash
```

项目仍兼容旧的 `OPENAI_API_KEY` / `OPENAI_BASE_URL`，但新部署建议使用 `AI_*` 变量。

## 上线与评审

- 推荐部署到 Vercel，并在环境变量中配置 `AI_API_KEY`
- 部署后可访问 `GET /api/ai-health?probe=1` 验证生产环境是否能正常调用 DeepSeek 兼容接口

## 质量检查

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

或一次性运行：

```bash
npm run check
```

仓库内置 GitHub Actions CI，会在 `main` 分支 push 和 pull request 时自动执行同样的质量检查。

项目对摘要和洞察接口做了服务端内存缓存与简单限流，用于降低第三方接口抖动和 AI 调用成本。生产环境多实例部署时，如需跨实例共享缓存，建议接入 Redis/Upstash 等外部缓存。

## Redis 缓存（可选）

生产环境建议使用 Upstash Redis。配置后，摘要缓存、洞察缓存、Bilibili 搜索缓存和接口限流会跨实例共享；未配置时自动降级为单实例内存模式。

```txt
UPSTASH_REDIS_REST_URL=你的 Upstash REST URL
UPSTASH_REDIS_REST_TOKEN=你的 Upstash REST Token
```

## 运维指标（可选）

设置 `METRICS_TOKEN` 后，可以通过受保护接口查看进程内运行指标：

```bash
curl -H "Authorization: Bearer $METRICS_TOKEN" http://localhost:3000/api/metrics
```

如果未设置 `METRICS_TOKEN`，`/api/metrics` 会返回 404，避免公开暴露运维信息。

## 文档

- [PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md)
- [PROJECT_SPEC.md](docs/PROJECT_SPEC.md)
