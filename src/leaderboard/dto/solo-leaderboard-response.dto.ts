export interface SoloRankRow {
    userId: number;
    username: string;
    profileUrl: string | null;
    totalCore: string;
    avgWpm: string;
    playCount: string;
    snippetCount: string;
    avgAccuracy: string;
    rank: string;
    total_count: string;
}

export class SoloLeaderboardEntryDto {
    rank!: number;
    userId!: number;
    username!: string;
    profileUrl!: string | null;
    totalCore!: number;
    avgWpm!: number;
    playCount!: number;
    snippetCount!: number;
    avgAccuracy!: number;
    isMe!: boolean;

    static from(row: SoloRankRow, myUserId: number | null): SoloLeaderboardEntryDto {
        const dto        = new SoloLeaderboardEntryDto();
        dto.rank         = Number(row.rank);
        dto.userId       = Number(row.userId);
        dto.username     = row.username;
        dto.profileUrl   = row.profileUrl;
        dto.totalCore    = Number(row.totalCore);
        dto.avgWpm       = Number(row.avgWpm);
        dto.playCount    = Number(row.playCount);
        dto.snippetCount = Number(row.snippetCount);
        dto.avgAccuracy  = Number(row.avgAccuracy);
        dto.isMe         = myUserId !== null && Number(row.userId) === myUserId;
        return dto;
    }
}

export class SoloLeaderboardResponseDto {
    entries!: SoloLeaderboardEntryDto[];
    myRank!: number | null;
    totalCount!: number;
    page!: number;
    size!: number;

    static from(
        rows: SoloRankRow[],
        page: number,
        size: number,
        myUserId: number | null,
        myRank: number | null,
    ): SoloLeaderboardResponseDto {
        const dto      = new SoloLeaderboardResponseDto();
        dto.entries    = rows.map(r => SoloLeaderboardEntryDto.from(r, myUserId));
        dto.totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
        dto.page       = page;
        dto.size       = size;
        dto.myRank     = myRank;
        return dto;
    }
}
