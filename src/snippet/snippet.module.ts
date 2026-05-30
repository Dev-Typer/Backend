import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snippet } from './snippet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Snippet])],
  exports: [TypeOrmModule],
})
export class SnippetModule {}
