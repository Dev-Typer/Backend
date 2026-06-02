import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SnippetAdminService } from './snippet-admin.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { AdminSnippetQueryDto } from './dto/snippet-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/enums/user-role.enum';
import { ApiResponse } from '../common/dto/api-response';

// 모든 엔드포인트: ADMIN Role 필요 (미인증 401, 권한 없음 403)
@Controller('/api/admin/snippets')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN)
export class SnippetAdminController {
  constructor(private readonly snippetAdminService: SnippetAdminService) {}

  // GET /api/admin/snippets?language=&difficulty=&isActive=&page=&size=
  // 스니펫 목록 조회. 비활성 포함 전체 조회 가능
  @Get()
  async findAll(@Query() query: AdminSnippetQueryDto) {
    const result = await this.snippetAdminService.findAll(query);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  // POST /api/admin/snippets
  // 스니펫 등록. title, language, difficulty, content 필수 / source 선택
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSnippetDto) {
    const snippet = await this.snippetAdminService.create(dto);
    return ApiResponse.success(snippet, HttpStatus.CREATED);
  }

  // GET /api/admin/snippets/:id
  // 스니펫 단건 조회. 비활성화된 스니펫도 조회 가능
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const snippet = await this.snippetAdminService.findById(id);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  // PATCH /api/admin/snippets/:id
  // 스니펫 부분 수정. 전달된 필드만 업데이트 (undefined 필드는 무시)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSnippetDto,
  ) {
    const snippet = await this.snippetAdminService.update(id, dto);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  // DELETE /api/admin/snippets/:id
  // 스니펫 비활성화 (소프트 삭제). isActive: false 처리, DB에서 삭제하지 않음
  // 이미 비활성화된 경우 변경 없이 200 반환
  @Delete(':id')
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    await this.snippetAdminService.deactivate(id);
    return ApiResponse.success(null, HttpStatus.OK);
  }
}
