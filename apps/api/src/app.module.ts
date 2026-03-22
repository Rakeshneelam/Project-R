import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { VerificationModule } from './modules/verification/verification.module';
import { CommunityModule } from './modules/community/community.module';
import { PostModule } from './modules/post/post.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { RewardModule } from './modules/reward/reward.module';
import { FriendshipModule } from './modules/friendship/friendship.module';
import { DatingModule } from './modules/dating/dating.module';
import { MessageModule } from './modules/message/message.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { AdminModule } from './modules/admin/admin.module';
import { MediaModule } from './modules/media/media.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting: 60 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    // Core infrastructure
    PrismaModule,
    RedisModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UserModule,
    VerificationModule,
    CommunityModule,
    PostModule,
    ChallengeModule,
    LeaderboardModule,
    RewardModule,
    FriendshipModule,
    DatingModule,
    MessageModule,
    NotificationModule,
    ModerationModule,
    AdminModule,
    MediaModule,
    GatewayModule,
  ],
})
export class AppModule {}
