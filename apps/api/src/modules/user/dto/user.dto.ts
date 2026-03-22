import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ enum: ['INTROVERT', 'EXTROVERT', 'AMBIVERT'] })
  @IsOptional()
  @IsString()
  socialType?: string;

  @ApiPropertyOptional({ enum: ['TEXT_FIRST', 'VOICE_FIRST', 'VIDEO_FIRST', 'IN_PERSON_FIRST'] })
  @IsOptional()
  @IsString()
  communicationStyle?: string;

  @ApiPropertyOptional({ enum: ['NOT_INTERESTED', 'OPEN_TO_IT', 'ACTIVELY_LOOKING'] })
  @IsOptional()
  @IsString()
  datingIntent?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  friendIntents?: string[];

  @ApiPropertyOptional({ type: [String], example: ['gaming', 'hiking', 'cooking'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ type: [String], example: ['chill', 'adventurous', 'nerdy'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vibeTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genderPreference?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isProfilePublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showCity?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showDistance?: boolean;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  challengeReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  friendRequestNotifs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  datingNotifs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  communityNotifs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  leaderboardNotifs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  streakReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dmFromStrangers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowFriendRequests?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowDatingMatch?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safeMode?: boolean;
}
