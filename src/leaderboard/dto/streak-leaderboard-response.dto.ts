export interface StreakRankRow {
    userId: number;
    username: string;
    profileUrl: string | null;
    current_streak: string;
    rank: string;
    total_count: string;
}

export class StreakLeaderboardEntryDto {
    rank!: number;
    userId!: number;
    username!: string;
    profileUrl!: string | null;
    currentStreak!: number;
    isMe!: boolean;

    static from(row: StreakRankRow, myUserId: number | null): StreakLeaderboardEntryDto {
        const dto         = new StreakLeaderboardEntryDto();
        dto.rank          = Number(row.rank);
        dto.userId        = Number(row.userId);
        dto.username      = row.username;
        dto.profileUrl    = row.profileUrl;
        dto.currentStreak = Number(row.current_streak);
        dto.isMe          = myUserId !== null && Number(row.userId) === myUserId;
        return dto;
    }
}

export class StreakLeaderboardResponseDto {
    entries!: StreakLeaderboardEntryDto[];
    myRank!: number | null;
    totalCount!: number;
    page!: number;
    size!: number;

    static from(
        rows: StreakRankRow[],
        page: number,
        size: number,
        myUserId: number | null,
        myRank: number | null,
    ): StreakLeaderboardResponseDto {
        const dto      = new StreakLeaderboardResponseDto();
        dto.entries    = rows.map(r => StreakLeaderboardEntryDto.from(r, myUserId));
        dto.totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
        dto.page       = page;
        dto.size       = size;
        dto.myRank     = myRank;
        return dto;
    }
}
