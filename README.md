# TaqTaq（番剧舆情与亮点速览）

一个用于评审与产品讨论的 Demo：从公开数据源抓取番剧简介与社区讨论线索，并用 AI 生成“一句话摘要”和“深度洞察”。

## 本地运行

```bash
npm i
npm run dev
```

浏览器打开 `http://localhost:3000`。

## AI 配置

本项目默认支持“演示模式”：不配置 Key 也能跑通完整交互（会返回 Mock/截断结果）。

如需开启真实 AI 调用，在项目根目录创建 `.env.local`：

```txt
OPENAI_API_KEY=你的真实 Key
OPENAI_BASE_URL=https://api.openai.com/v1
```

## 上线与评审

- 推荐部署到 Vercel，并在环境变量中配置 `OPENAI_API_KEY`
- 部署后可访问 `GET /api/ai-health?probe=1` 验证生产环境是否能正常调用 OpenAI

## 文档

- [PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md)
- [PROJECT_SPEC.md](docs/PROJECT_SPEC.md)
