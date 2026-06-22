import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';
import { SnippetService } from './default/snippet.service';
import { SnippetController } from './default/snippet.controller';
import { SnippetAdminService } from './admin/snippet-admin.service';
import { SnippetAdminController } from './admin/snippet-admin.controller';
import { SnippetRepository } from './default/snippet.repository';
import { SnippetAdminRepository } from './admin/snippet-admin.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet])],
  controllers: [SnippetController, SnippetAdminController],
  providers: [SnippetService, SnippetAdminService, SnippetRepository, SnippetAdminRepository],
  exports: [TypeOrmModule, SnippetService, SnippetAdminService, SnippetRepository],
})
export class SnippetModule {}
