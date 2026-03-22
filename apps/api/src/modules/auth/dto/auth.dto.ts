import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @MinLength(2)
  displayName: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

export class LoginDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    role: string;
    displayName: string;
  };
}
