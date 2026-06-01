import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { SnippetQueryDto } from './dto/snippet-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/enums/user-role.enum';
import { ApiResponse } from '../common/dto/api-response';

@Controller('/api/admin/snippets')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN)
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSnippetDto) {
    const snippet = await this.snippetService.create(dto);
    return ApiResponse.success(snippet, HttpStatus.CREATED);
  }

  @Get()
  async findAll(@Query() query: SnippetQueryDto) {
    const result = await this.snippetService.findAll(query);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const snippet = await this.snippetService.findById(id);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSnippetDto,
  ) {
    const snippet = await this.snippetService.update(id, dto);
    return ApiResponse.success(snippet, HttpStatus.OK);
  }

  @Delete(':id')
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    await this.snippetService.deactivate(id);
    return ApiResponse.success(null, HttpStatus.OK);
  }
}
