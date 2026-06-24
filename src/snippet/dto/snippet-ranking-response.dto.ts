import type { RankingRow } from '../../snippet-result/snippet-result.repository';

export class SnippetRankingItemDto {
    resultId!: number;
    rank!: number;
    userId!: number;
    username!: string;
    profileUrl!: string | null;
    core!: number;
    wpm!: number;
    rawWpm!: number;
    accuracy!: number;
    durationSec!: number;
    createdAt!: Date;

    static from(row: RankingRow, rank: number): SnippetRankingItemDto {
        const dto       = new SnippetRankingItemDto();
        dto.resultId    = Number(row.resultId);
        dto.rank        = rank;
        dto.userId      = Number(row.userId);
        dto.username    = row.username;
        dto.profileUrl  = row.profileUrl;
        dto.core        = Number(row.core);
        dto.wpm         = Number(row.wpm);
        dto.rawWpm      = Number(row.rawWpm);
        dto.accuracy    = Number(row.accuracy);
        dto.durationSec = Number(row.durationSec);
        dto.createdAt   = row.createdAt;
        return dto;
    }
}

export class SnippetRankingResponseDto {
    items!: SnippetRankingItemDto[];
    total!: number;
    page!: number;
    size!: number;
}
