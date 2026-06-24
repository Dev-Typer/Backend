import { Controller, Get, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SnippetResultService } from './snippet-result.service';
import { SnippetRankingResponseDto } from '../snippet/dto/snippet-ranking-response.dto';
import { ApiResponse } from '../common/dto/api-response';

@Controller('/api/snippets')
export class SnippetRankingController {
  constructor(private readonly snippetResultService: SnippetResultService) {}

  @Get(':id/ranking')
  async findRanking(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = '1',
    @Query('size') size = '50',
  ): Promise<ApiResponse<SnippetRankingResponseDto>> {
    const result = await this.snippetResultService.findRanking(
      id,
      Math.max(1, Number(page)),
      Math.max(1, Number(size)),
    );
    return ApiResponse.success(result, HttpStatus.OK);
  }
}
