import { Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [FriendshipController],
  providers: [FriendshipService],
  exports: [FriendshipService],
})
export class FriendshipModule {}
