import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { SnippetQueryDto } from './dto/snippet-query.dto';
import { ApiResponse } from '../common/dto/api-response';
import { SnippetLanguage } from './enums/snippet-language.enum';
import { SnippetDifficulty } from './enums/snippt-difficulty.enum';

@Controller('/api/snippets')
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  // GET /api/snippets?language=&difficulty=&page=&limit=
  // 활성화된 스니펫 목록 조회. 인증 불필요 (isActive: true 고정)
  @Get()
  async findAll(@Query() query: SnippetQueryDto) {
    const result = await this.snippetService.findAll(query);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  // GET /api/snippets/random?language=&difficulty=
  // 솔로 연습용 랜덤 스니펫 조회. 인증 불필요
  @Get('random')
  async findRandom(
    @Query('language') language?: SnippetLanguage,
    @Query('difficulty') difficulty?: SnippetDifficulty,
  ) {
    const snippet = await this.snippetService.findRandom(language, difficulty);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  // GET /api/snippets/daily
  // 오늘의 데일리 챌린지 스니펫 조회. 인증 불필요
  @Get('daily')
  async findDaily() {
    const snippet = await this.snippetService.findDaily();
    return ApiResponse.success(snippet, HttpStatus.OK);
  }
}
