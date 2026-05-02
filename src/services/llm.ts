import { createAiClient } from '@/lib/ai';
import { incrementMetric, recordTiming } from '@/lib/metrics';
import { AnimeInsight, BilibiliReference, ExpertOpinion } from '@/types/anime';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length > 0 ? items : fallback;
};

const toExpertOpinions = (value: unknown): ExpertOpinion[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    author: typeof item.author === 'string' ? item.author : '未知 UP 主',
    opinion: typeof item.opinion === 'string' ? item.opinion : '暂无明确观点。',
  }));
};

export const normalizeInsight = (value: unknown, animeName: string): AnimeInsight => {
  const data = isRecord(value) ? value : {};

  return {
    weighted_score: typeof data.weighted_score === 'string' ? data.weighted_score : 'N/A',
    consensus: typeof data.consensus === 'string'
      ? data.consensus
      : `暂未获得《${animeName}》的稳定 AI 洞察。`,
    highlights: toStringArray(data.highlights, ['暂无名场面']),
    expert_opinions: toExpertOpinions(data.expert_opinions),
    trend: typeof data.trend === 'string' ? data.trend : '数据收集不足',
  };
};

export const summarizeAnimeInsight = async (
  animeName: string,
  searchResults: BilibiliReference[]
): Promise<AnimeInsight | null> => {
  const contextData = searchResults.map(r => 
    `UP主: ${r.author} ${r.isKOL ? '(认证/头部UP)' : ''}\n标题: ${r.title}\n简介: ${r.description}\n播放量: ${r.play}`
  ).join('\n---\n');

  const prompt = `
    你是一个深耕二次元圈子的资深评论员。请针对番剧《${animeName}》，基于以下从 B 站搜索到的真实数据进行深度分析。
    
    【核心校验指令 - 极其重要】：
    在开始分析前，请检查参考数据中的视频标题是否真的与《${animeName}》相关。
    - 如果视频标题与《${animeName}》无关（例如搜索结果中出现了其他番剧），请**绝对不要**将其纳入分析。
    - 如果所有数据都无关，请在 JSON 的 consensus 中返回：“暂未在 B 站找到与该番剧直接相关的深度评价视频。”
    
    【真实参考数据】：
    ${contextData || '暂无搜索结果'}
    
    【任务要求】：
    1. 必须优先提炼标记为“(认证/头部UP)”且**确认相关**的观点。
    2. 严格区分“搬运号”和“原创号”。
    3. 加权评分要综合参考大 UP 主的专业分。
    
    【输出格式】（严格 JSON）：
    {
      "weighted_score": "加权后的分数",
      "consensus": "基于相关大 UP 主观点的核心总结",
      "highlights": ["名场面或高能点"],
      "expert_opinions": [
        {"author": "UP主名称", "opinion": "其具体的、有见地的评价内容"}
      ],
      "trend": "当前的口碑走势"
    }
  `;

  try {
    const startedAt = Date.now();
    const { client, config } = createAiClient();

    if (!config.configured || !client) {
      incrementMetric('ai.demo_mode');
      // 演示模式：如果没有 API Key，根据是否有真实搜索结果来返回 Mock 数据
      const hasRealData = searchResults && searchResults.length > 0;
      return {
        weighted_score: hasRealData ? (8.0 + Math.random() * 1.5).toFixed(1) : 'N/A',
        consensus: hasRealData 
          ? `基于 B 站 ${searchResults.length} 条真实视频汇总：该作在社区引起了广泛讨论，UP主 @${searchResults[0].author} 等对其评价较高。`
          : `暂无实时舆论数据，建议手动搜索《${animeName}》查看。`,
        highlights: hasRealData 
          ? [`根据 ${searchResults[0].title} 等视频整理中...`, '精彩片段：见参考资料'] 
          : ['暂无名场面'],
        expert_opinions: hasRealData 
          ? searchResults.slice(0, 2).map(r => ({ author: r.author, opinion: `其视频“${r.title}”中表达了对本作的关注。` }))
          : [],
        trend: hasRealData ? '讨论热度持续上升' : '数据收集不足'
      };
    }

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}') as unknown;
    incrementMetric('ai.success');
    recordTiming('ai.duration_ms', Date.now() - startedAt);
    return normalizeInsight(parsed, animeName);
  } catch (error) {
    incrementMetric('ai.error');
    console.error('Error calling LLM:', error);
    return null;
  }
};
