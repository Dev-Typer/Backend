import { Controller, Get, HttpStatus, Param, ParseIntPipe } from '@nestjs/common';
import { SnippetResultService } from './snippet-result.service';
import { SnippetRankingResponseDto } from '../snippet/dto/snippet-ranking-response.dto';
import { ApiResponse } from '../common/dto/api-response';

@Controller('/api/snippets')
export class SnippetRankingController {
  constructor(private readonly snippetResultService: SnippetResultService) {}

  // GET /api/snippets/:id/ranking
  // 스니펫 랭킹 조회. 인증 불필요 — 유저별 최고 기록 기준 상위 50위
  @Get(':id/ranking')
  async findRanking(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<SnippetRankingResponseDto>> {
    const result = await this.snippetResultService.findRanking(id);
    return ApiResponse.success(result, HttpStatus.OK);
  }
}
