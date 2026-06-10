import { SnippetResponseDto } from '../../snippet/dto/snippet-response.dto';
import { DailyChallenge } from '../entities/daily-challenge.entity';

export class DailyChallengeResponseDto {
    id!: number;
    date!: string;
    snippet!: SnippetResponseDto;

    static from(challenge: DailyChallenge): DailyChallengeResponseDto {
        const dto = new DailyChallengeResponseDto();
        dto.id      = challenge.id;
        dto.date    = challenge.date;
        dto.snippet = SnippetResponseDto.from(challenge.snippet);
        return dto;
    }
}