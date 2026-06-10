import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnippetResult } from './entities/snippet-result.entity';
import { SnippetResultService } from './snippet-result.service';
import { SnippetResultController } from './snippet-result.controller';
import { SnippetRankingController } from './snippet-ranking.controller';
import { SnippetModule } from '../snippet/snippet.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SnippetResult]),
        SnippetModule,
    ],
    controllers: [SnippetResultController, SnippetRankingController],
    providers: [SnippetResultService],
    exports: [SnippetResultService, TypeOrmModule],
})
export class SnippetResultModule {}
