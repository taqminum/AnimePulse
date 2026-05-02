import OpenAI from 'openai';

export const DEFAULT_AI_MODEL = 'deepseek-v4-flash';
export const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com/v1';

export const getAiConfig = () => {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
  const baseURL = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_AI_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_AI_MODEL;
  const configured = !!apiKey && apiKey !== 'your-api-key';

  return {
    apiKey,
    baseURL,
    model,
    configured,
  };
};

export const createAiClient = () => {
  const config = getAiConfig();

  if (!config.configured) {
    return { client: null, config };
  }

  return {
    client: new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL }),
    config,
  };
};
