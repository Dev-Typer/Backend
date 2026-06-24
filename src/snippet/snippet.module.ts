import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';
import { SnippetLike } from './entities/snippet-like.entity';
import { SnippetService } from './default/snippet.service';
import { SnippetController } from './default/snippet.controller';
import { SnippetAdminService } from './admin/snippet-admin.service';
import { SnippetAdminController } from './admin/snippet-admin.controller';
import { SnippetRepository } from './default/snippet.repository';
import { SnippetAdminRepository } from './admin/snippet-admin.repository';
import { SnippetLikeRepository } from './snippet-like.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet, SnippetLike])],
  controllers: [SnippetController, SnippetAdminController],
  providers: [SnippetService, SnippetAdminService, SnippetRepository, SnippetAdminRepository, SnippetLikeRepository],
  exports: [TypeOrmModule, SnippetService, SnippetAdminService, SnippetRepository, SnippetLikeRepository],
})
export class SnippetModule {}
