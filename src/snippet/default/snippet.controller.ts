import { Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { SnippetQueryDto, RandomSnippetQueryDto } from '../dto/snippet-query.dto';
import { SnippetResponseDto } from '../dto/snippet-response.dto';
import { SnippetLikeResponseDto } from '../dto/snippet-like-response.dto';
import { ApiResponse } from '../../common/dto/api-response';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/types/jwt-user.type';

@Controller('/api/snippets')
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  // GET /api/snippets?language=&difficulty=&page=&size=
  // 활성 스니펫 목록 조회. 인증 불필요 (isActive: true 고정)
  @Get()
  async findAll(@Query() query: SnippetQueryDto): Promise<ApiResponse<{ data: SnippetResponseDto[]; total: number; page: number; size: number }>> {
    const result = await this.snippetService.findAll(query);
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

  // POST /api/snippets/:id/like
  // 좋아요 추가. 이미 좋아요 상태면 현재 상태 그대로 반환 (멱등)
  // ⚠️ /:id/like 는 /:id 보다 위에 있어야 함
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
  // 좋아요 취소. 이미 취소 상태면 현재 상태 그대로 반환 (멱등)
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  async unlike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ): Promise<ApiResponse<SnippetLikeResponseDto>> {
    const result = await this.snippetService.unlike(id, user.userId);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  // GET /api/snippets/:id
  // 단건 조회. 비활성화된 스니펫은 404 반환
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<SnippetResponseDto>> {
    const snippet = await this.snippetService.findOne(id);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

}
