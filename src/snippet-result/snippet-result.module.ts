import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnippetResult } from './entities/snippet-result.entity';
import { Snippet } from '../snippet/snippet.entity';
import { SnippetModule } from '../snippet/snippet.module';
import { SnippetResultService } from './snippet-result.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SnippetResult, Snippet]),
        SnippetModule,
    ],
    providers: [SnippetResultService],
    exports: [SnippetResultService],
})
export class SnippetResultModule {}
