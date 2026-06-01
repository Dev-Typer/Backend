import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';
import { SnippetService } from './snippet.service';
import { SnippetController } from './snippet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet])],
  controllers: [SnippetController],
  providers: [SnippetService],
  exports: [TypeOrmModule, SnippetService],
})
export class SnippetModule {}
