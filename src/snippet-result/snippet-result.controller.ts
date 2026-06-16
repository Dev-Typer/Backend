import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SnippetResultService } from './snippet-result.service';
import { SaveSnippetResultDto } from './dto/save-snippet-result.dto';
import { SnippetResultResponseDto } from './dto/snippet-result-response.dto';
import { SnippetResultStatsResponseDto } from './dto/snippet-result-stats-response.dto';
import { SnippetResultReplayResponseDto } from './dto/snippet-result-replay-response.dto';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/dto/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/jwt-user.type';

@Controller('/api/snippet-results')
export class SnippetResultController {
  constructor(private readonly snippetResultService: SnippetResultService) {}

  // POST /api/snippet-results
  // 솔로 플레이 결과 저장. Optional JWT — 비로그인 시 저장 스킵 후 200 반환
  @Post()
  @UseGuards(OptionalJwtGuard)
  async save(
    @CurrentUser() user: JwtUser | null,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SaveSnippetResultDto,
  ): Promise<ApiResponse<SnippetResultResponseDto | null>> {
    const result = await this.snippetResultService.save(dto, user?.userId ?? null);

    if (!result) {
      res.status(HttpStatus.OK);
      return new ApiResponse(true, HttpStatus.OK, null, '비로그인 상태로 결과가 저장되지 않았습니다');
    }

    res.status(HttpStatus.CREATED);
    return ApiResponse.success(result, HttpStatus.CREATED);
  }

  // GET /api/snippet-results/:id
  // 통계 조회. 본인 결과만 조회 가능
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findStats(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ): Promise<ApiResponse<SnippetResultStatsResponseDto>> {
    const result = await this.snippetResultService.findStats(id, user.userId);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  // GET /api/snippet-results/:id/replay
  // 리플레이 조회. 인증 불필요 — 누구나 열람 가능
  @Get(':id/replay')
  async findReplay(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<SnippetResultReplayResponseDto>> {
    const result = await this.snippetResultService.findReplay(id);
    return ApiResponse.success(result, HttpStatus.OK);
  }
}
