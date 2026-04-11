import { NextResponse } from 'next/server';
import axios from 'axios';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const BANGUMI_API_BASE = 'https://api.bgm.tv';

export async function POST(request: Request) {
  try {
    const { animeItems } = await request.json();
    
    // 为了 Demo 性能，我们只对前 15 个番剧进行摘要生成
    const itemsToProcess = animeItems.slice(0, 15);
    
    const summarizedItems = await Promise.all(itemsToProcess.map(async (item: any) => {
      try {
        // 1. 获取详细简介
        const detailRes = await axios.get(`${BANGUMI_API_BASE}/v0/subjects/${item.id}`);
        const fullSummary = detailRes.data.summary || '';
        
        if (!fullSummary) return { id: item.id, summary: '暂无简介' };

        // 2. 如果没有 API Key，进行简单的截断
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const isDemoMode = !openaiApiKey || openaiApiKey === 'your-api-key';

        if (isDemoMode) {
          return { id: item.id, summary: fullSummary.slice(0, 50) + '...' };
        }

        // 3. 使用 LLM 生成极简一句话摘要
        const prompt = `将以下动画简介缩减为一句话（20字以内），要求吸引人且保留核心设定：\n${fullSummary}`;
        const openai = new OpenAI({ apiKey: openaiApiKey, baseURL });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
        });

        return { 
          id: item.id, 
          summary: completion.choices[0].message.content?.trim() || fullSummary.slice(0, 50) 
        };
      } catch (err) {
        return { id: item.id, summary: '简介加载失败' };
      }
    }));

    return NextResponse.json({ summaries: summarizedItems });
  } catch (error) {
    console.error('Error in anime-summaries API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
