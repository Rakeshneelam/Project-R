import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CommunityService } from './community.service';
import { CurrentUser } from '@/common/decorators';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityType } from '@bondbridge/database';

class CreateCommunityDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CommunityType }) @IsOptional() @IsEnum(CommunityType) type?: CommunityType;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLocal?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rules?: string;
}

@ApiTags('communities')
@Controller('communities')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new community' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCommunityDto) {
    return this.communityService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Browse communities with filters' })
  async findAll(
    @Query('type') type?: CommunityType,
    @Query('isLocal') isLocal?: boolean,
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.communityService.findAll({ type, isLocal, city, search, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community details' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityService.findById(id, userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a community' })
  async join(@Param('id') id: string, @CurrentUser('id') userId: string, @Query('anonymous') anonymous?: boolean) {
    return this.communityService.join(userId, id, anonymous);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a community' })
  async leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.communityService.leave(userId, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List community members' })
  async getMembers(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.communityService.getMembers(id, page, limit);
  }
}
