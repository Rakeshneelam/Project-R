import { Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
@Module({ controllers: [FriendshipController], providers: [FriendshipService], exports: [FriendshipService] })
export class FriendshipModule {}
