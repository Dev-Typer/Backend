import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { SnippetModule } from '../snippet/snippet.module';
import { SnippetResultModule } from '../snippet-result/snippet-result.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyChallenge]),
    SnippetModule,
    SnippetResultModule,
  ],
  controllers: [],
  providers: [],
})
export class DailyChallengeModule {}
