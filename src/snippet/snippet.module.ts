import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';
import { SnippetService } from './snippet.service';
import { SnippetController } from './snippet.controller';
import { SnippetAdminService } from './snippet-admin.service';
import { SnippetAdminController } from './snippet-admin.controller';
import { SnippetRepository } from './snippet.repository';
import { SnippetAdminRepository } from './snippet-admin.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet])],
  controllers: [SnippetController, SnippetAdminController],
  providers: [SnippetService, SnippetAdminService, SnippetRepository, SnippetAdminRepository],
  exports: [TypeOrmModule, SnippetService, SnippetAdminService, SnippetRepository],
})
export class SnippetModule {}
