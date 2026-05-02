interface RedisResponse<T> {
  result?: T;
  error?: string;
}

const getRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  return {
    url,
    token,
    configured: !!url && !!token,
  };
};

export const isRedisConfigured = () => getRedisConfig().configured;

export const redisCommand = async <T>(command: unknown[]): Promise<T | null> => {
  const config = getRedisConfig();

  if (!config.configured || !config.url || !config.token) {
    return null;
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Redis request failed with status ${response.status}`);
  }

  const data = await response.json() as RedisResponse<T>;

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result ?? null;
};
