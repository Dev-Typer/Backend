export class StreakDayEntry {
    date!: string;          // 'YYYY-MM-DD'
    submitted!: boolean;
    wpm!: number | null;    // 해당 날 최고 wpm, 미제출 시 null
}

export class UserStreakDto {
    userId!: number;
    type!: 'year' | 'recent';
    year!: number | null;   // type === 'year' 일 때만 값 있음
    current!: number;       // 어제까지 기준 현재 연속 일수
    longest!: number;       // 전체 기간 역대 최장 연속 일수
    yearData!: StreakDayEntry[];
}
