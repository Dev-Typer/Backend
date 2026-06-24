import { Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { SnippetQueryDto, RandomSnippetQueryDto } from '../dto/snippet-query.dto';
import { SnippetResponseDto } from '../dto/snippet-response.dto';
import { SnippetLikeResponseDto } from '../dto/snippet-like-response.dto';
import { ApiResponse } from '../../common/dto/api-response';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user.type';

@Controller('/api/snippets')
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  // GET /api/snippets?keyword=&language=&difficulty=&sort=&likedByMe=&playedByMe=&page=&size=
  // 비로그인 가능. 로그인 시 isLiked, likedByMe, playedByMe 파라미터 활성화
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query() query: SnippetQueryDto,
    @CurrentUser() user: JwtUser | null,
  ): Promise<ApiResponse<{ data: SnippetResponseDto[]; total: number; page: number; size: number }>> {
    const result = await this.snippetService.findAll(query, user?.userId);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  // GET /api/snippets/random?language=&difficulty=
  // 솔로 연습용 랜덤 스니펫 조회. 인증 불필요
  // ⚠️ /random 은 /:id 보다 반드시 위에 있어야 함
  @Get('random')
  async findRandom(@Query() query: RandomSnippetQueryDto): Promise<ApiResponse<SnippetResponseDto>> {
    const snippet = await this.snippetService.findRandom(query.language, query.difficulty);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  // GET /api/snippets/:id
  // 단건 조회. 비활성화된 스니펫은 404 반환
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<SnippetResponseDto>> {
    const snippet = await this.snippetService.findOne(id);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  // POST /api/snippets/:id/like
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ): Promise<ApiResponse<SnippetLikeResponseDto>> {
    const result = await this.snippetService.like(id, user.userId);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  // DELETE /api/snippets/:id/like
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ): Promise<ApiResponse<SnippetLikeResponseDto>> {
    const result = await this.snippetService.unlike(id, user.userId);
    return ApiResponse.success(result, HttpStatus.OK);
  }

}
