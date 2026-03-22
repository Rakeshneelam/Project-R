import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PostService } from './post.service';
import { CurrentUser } from '@/common/decorators';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreatePostDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() mediaUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}

class CreateCommentDto {
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAnonymous?: boolean;
}

class AddReactionDto {
  @ApiProperty({ enum: ['UPVOTE', 'CREATIVE', 'SUPPORTIVE', 'FUNNY', 'THOUGHTFUL'] })
  @IsString() type: string;
}

@ApiTags('posts')
@Controller('communities/:communityId/posts')
@UseGuards(AuthGuard('firebase-jwt'))
@ApiBearerAuth()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiOperation({ summary: 'Create a post in a community' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.postService.create(userId, communityId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List posts in a community' })
  async findAll(
    @Param('communityId') communityId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.postService.findByCommunity(communityId, page, limit);
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Get post with threaded comments' })
  async findOne(@Param('postId') postId: string) {
    return this.postService.findById(postId);
  }

  @Post(':postId/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postService.addComment(userId, postId, dto.content, dto.parentId, dto.isAnonymous);
  }

  @Post(':postId/reactions')
  @ApiOperation({ summary: 'Add or toggle a reaction' })
  async addReaction(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.postService.addReaction(userId, postId, dto.type);
  }
}
