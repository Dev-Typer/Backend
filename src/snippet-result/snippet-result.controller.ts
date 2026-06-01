import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SnippetResultService } from './snippet-result.service';
import { SaveSnippetResultDto } from './dto/save-snippet-result.dto';
import { SnippetResultResponseDto } from './dto/snippet-result-response.dto';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { ApiResponse } from '../common/dto/api-response';

// POST /api/snippet-results
// 솔로 플레이 결과 저장. Optional JWT — 비로그인 시 저장 스킵 후 200 반환
@Controller('/api/snippet-results')
export class SnippetResultController {
  constructor(private readonly snippetResultService: SnippetResultService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  async save(
    @Req() req: Request & { user?: { userId: number } },
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SaveSnippetResultDto,
  ): Promise<ApiResponse<SnippetResultResponseDto | null>> {
    const userId = req.user?.userId ?? null;
    const result = await this.snippetResultService.save(dto, userId);

    if (!result) {
      res.status(HttpStatus.OK);
      return new ApiResponse(true, HttpStatus.OK, null, '비로그인 상태로 결과가 저장되지 않았습니다');
    }

    res.status(HttpStatus.CREATED);
    return ApiResponse.success(result, HttpStatus.CREATED);
  }
}
