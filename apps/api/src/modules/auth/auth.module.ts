import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseStrategy } from './firebase.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'firebase-jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
