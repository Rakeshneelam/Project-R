import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignupDto } from './dto';
import { CurrentUser } from '@/common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseGuards(AuthGuard('firebase-jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync a newly registered Firebase user to the PostgreSQL database' })
  async signup(
    @CurrentUser() firebaseUser: any,
    @Body() dto: SignupDto
  ) {
    return this.authService.syncUser(firebaseUser, dto);
  }

  // Firebase handles login, logout, and token refresh directly in the client.
  // We no longer need endpoints for those actions here since the backend is
  // purely a resource server verifying Firebase tokens.
}
