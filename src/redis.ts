import { createClient } from 'redis';
import config from './config';

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function connectRedis(): Promise<RedisClient | null> {
  try {
    const client = createClient({ url: config.redis.url });
    client.on('error', (err: Error) => {
      console.warn('Redis error:', err.message);
    });
    await client.connect();
    redisClient = client;
    console.log('Redis connected');
    return client;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Redis connection failed:', msg);
    return null;
  }
}

export function getRedis(): RedisClient | null {
  return redisClient;
}

export default { connectRedis, getRedis };
