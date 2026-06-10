import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { SnippetResultModule } from '../snippet-result/snippet-result.module';
import { DailyChallengeService } from './daily-challenge.service';
import { DailyChallengeController } from './daily-challenge.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyChallenge]),
    SnippetResultModule,
  ],
  controllers: [DailyChallengeController],
  providers: [DailyChallengeService],
})
export class DailyChallengeModule {}
