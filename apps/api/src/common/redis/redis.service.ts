import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─── Key-Value Operations ────────────────────────────
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // ─── Sorted Set Operations (for Leaderboards) ───────
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    return this.client.zrevrank(key, member);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrevrange(key, start, stop);
  }

  async zrevrangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ member: string; score: number }[]> {
    const result = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
    const entries: { member: string; score: number }[] = [];
    for (let i = 0; i < result.length; i += 2) {
      entries.push({ member: result[i], score: parseFloat(result[i + 1]) });
    }
    return entries;
  }

  async zincrby(key: string, increment: number, member: string): Promise<number> {
    const result = await this.client.zincrby(key, increment, member);
    return parseFloat(result);
  }

  // ─── Rate Limiting ──────────────────────────────────
  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  }

  // ─── Pub/Sub ────────────────────────────────────────
  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }
}
