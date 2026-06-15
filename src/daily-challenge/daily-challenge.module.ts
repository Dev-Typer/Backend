import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { SnippetModule } from '../snippet/snippet.module';
import { SnippetResultModule } from '../snippet-result/snippet-result.module';
import { DailyChallengeService } from './daily-challenge.service';
import { DailyChallengeController } from './daily-challenge.controller';
import { DailyChallengeRepository } from './daily-challenge.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyChallenge]),
    SnippetModule,
    SnippetResultModule,
  ],
  controllers: [DailyChallengeController],
  providers: [DailyChallengeService, DailyChallengeRepository],
})
export class DailyChallengeModule {}
