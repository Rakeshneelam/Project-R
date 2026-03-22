import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const checks: Record<string, string> = { api: 'ok' };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      await this.redis.client.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    return { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() };
  }
}
