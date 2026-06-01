import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';
import { SnippetResult } from '../snippet-result/entities/snippet-result.entity';
import { SnippetService } from './snippet.service';
import { SnippetController } from './snippet.controller';
import { SnippetAdminService } from './snippet-admin.service';
import { SnippetAdminController } from './snippet-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet, SnippetResult])],
  controllers: [SnippetController, SnippetAdminController],
  providers: [SnippetService, SnippetAdminService],
  exports: [TypeOrmModule, SnippetService, SnippetAdminService],
})
export class SnippetModule {}
