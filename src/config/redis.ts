import Redis from 'ioredis';

export let redis: Redis;

export async function connectRedis(): Promise<void> {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  await new Promise<void>((resolve, reject) => {
    redis.on('connect', () => {
      console.log('✅ Redis connected');
      resolve();
    });
    redis.on('error', (err) => {
      console.error('Redis error:', err);
      reject(err);
    });
  });
}