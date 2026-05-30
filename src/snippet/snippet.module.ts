import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';
import { SnippetService } from './snippet.service';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet])],
  providers: [SnippetService],
  exports: [TypeOrmModule, SnippetService],
})
export class SnippetModule {}
