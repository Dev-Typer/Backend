export class CoreHistoryPoint {
    date!: string;      // 'YYYY-MM-DD' (월 1일)
    totalCore!: number;
}

export class UserCoreHistoryDto {
    userId!: number;
    range!: string;
    points!: CoreHistoryPoint[];
}
