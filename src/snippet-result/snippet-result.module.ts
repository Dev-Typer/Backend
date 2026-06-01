import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnippetResult } from './entities/snippet-result.entity';
import { Snippet } from '../snippet/snippet.entity';
import { SnippetResultService } from './snippet-result.service';
import { SnippetResultController } from './snippet-result.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([SnippetResult, Snippet]),
    ],
    controllers: [SnippetResultController],
    providers: [SnippetResultService],
    exports: [SnippetResultService],
})
export class SnippetResultModule {}
