import { describe, expect, it } from 'vitest';
import { normalizeInsight } from './llm';

describe('normalizeInsight', () => {
  it('keeps valid model output', () => {
    const result = normalizeInsight({
      weighted_score: '8.8',
      consensus: '讨论热度较高。',
      highlights: ['作画稳定', '节奏不错'],
      expert_opinions: [{ author: '泛式', opinion: '值得关注。' }],
      trend: '上升',
    }, '测试番剧');

    expect(result).toEqual({
      weighted_score: '8.8',
      consensus: '讨论热度较高。',
      highlights: ['作画稳定', '节奏不错'],
      expert_opinions: [{ author: '泛式', opinion: '值得关注。' }],
      trend: '上升',
    });
  });

  it('falls back when model output is incomplete', () => {
    const result = normalizeInsight({
      highlights: [123, '', '有效亮点'],
      expert_opinions: [{ author: 1, opinion: null }],
    }, '测试番剧');

    expect(result.weighted_score).toBe('N/A');
    expect(result.consensus).toBe('暂未获得《测试番剧》的稳定 AI 洞察。');
    expect(result.highlights).toEqual(['有效亮点']);
    expect(result.expert_opinions).toEqual([{ author: '未知 UP 主', opinion: '暂无明确观点。' }]);
    expect(result.trend).toBe('数据收集不足');
  });
});
