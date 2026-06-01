import { Controller, Get, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { SnippetQueryDto, RandomSnippetQueryDto } from './dto/snippet-query.dto';
import { SnippetResponseDto } from './dto/snippet-response.dto';
import { ApiResponse } from '../common/dto/api-response';

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

  // GET /api/snippets/daily
  // 데일리 챌린지 스니펫 조회. 인증 불필요
  @Get('daily')
  async findDaily(): Promise<ApiResponse<SnippetResponseDto>> {
    const snippet = await this.snippetService.findDaily();
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  // GET /api/snippets/:id
  // 단건 조회. 비활성화된 스니펫은 404 반환
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<SnippetResponseDto>> {
    const snippet = await this.snippetService.findOne(id);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }
}
