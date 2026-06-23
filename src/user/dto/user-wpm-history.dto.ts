export class WpmMonthlyEntry {
    month!: string;     // 'YYYY-MM'
    avgWpm!: number;
}

export class UserWpmHistoryDto {
    userId!: number;
    range!: string;     // '6m'
    results!: WpmMonthlyEntry[];
}
