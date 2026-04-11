import { NextResponse } from 'next/server';
import { summarizeAnimeInsight } from '@/services/llm';
import axios from 'axios';

export const runtime = 'nodejs';

// 核心 KOL 库：这些是具有原创评价能力的头部 UP 主
const CORE_KOLS = [
  '泛式', '瓶子君152', '凉风Kaze', '哔哩哔哩番剧', '动画区', 'LexBurner', '阿正', '木鱼水心'
];

// 排除搬运/剪辑的黑名单关键词
const BLACKLIST_KEYWORDS = ['搬运', '剪辑', '纯享', '熟肉', '生肉', '片段', '合集', '1080P'];

const fetchRealBilibiliInfo = async (animeName: string) => {
  try {
    // 搜索词组合，优先搜索番剧名+评价类关键词
    const searchKeywords = `${animeName} 评价 锐评 泛式 瓶子君`;
    const response = await axios.get(`https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(searchKeywords)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Cookie': 'buvid3=INFOC'
      },
      timeout: 5000
    });

    if (response.data?.code === 0 && response.data?.data?.result) {
      const videoResult = response.data.data.result.find((r: any) => r.result_type === 'video');
      if (videoResult && videoResult.data) {
        return videoResult.data
          .filter((v: any) => {
            const title = v.title.replace(/<em class="keyword">|<\/em>/g, '').toLowerCase();
            const lowerAnimeName = animeName.toLowerCase();
            
            // 1. 强匹配：标题中必须包含番剧名的关键部分
            // 考虑中文名可能被拆分，我们取前两个字或完整名字进行匹配
            const animeKey = lowerAnimeName.length > 2 ? lowerAnimeName.substring(0, 4) : lowerAnimeName;
            const isRelevant = title.includes(lowerAnimeName) || title.includes(animeKey);
            
            if (!isRelevant) return false;

            // 2. 过滤搬运号
            const isBlacklisted = BLACKLIST_KEYWORDS.some(k => title.includes(k.toLowerCase()));
            const isCoreKOL = CORE_KOLS.some(k => v.author.includes(k) || title.includes(k.toLowerCase()));
            return isCoreKOL || !isBlacklisted;
          })
          .slice(0, 10)
          .map((v: any) => ({
            title: v.title.replace(/<em class="keyword">|<\/em>/g, ''),
            description: v.description,
            author: v.author,
            play: v.play,
            url: `https://www.bilibili.com/video/${v.bvid}`,
            isKOL: CORE_KOLS.some(k => v.author.includes(k)),
            type: v.typename
          }));
      }
    }
    return [];
  } catch (error) {
    console.warn('Real Bilibili search failed.');
    return [];
  }
};

export async function POST(request: Request) {
  try {
    const { animeName } = await request.json();
    
    // 1. 获取 B 站真实搜索结果
    const realBiliData = await fetchRealBilibiliInfo(animeName);
    
    // 2. 调用 LLM 进行深度汇总
    const insight = await summarizeAnimeInsight(animeName, realBiliData);
    
    if (!insight) {
      return NextResponse.json({ error: 'LLM failed' }, { status: 500 });
    }
    
    // 返回包含原始参考资料的结果
    return NextResponse.json({
      ...insight,
      references: realBiliData
    });
  } catch (error) {
    console.error('Error in anime-insight API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
