export class CurrentStreakResponseDto {
    currentStreak!: number;

    static from(currentStreak: number): CurrentStreakResponseDto {
        const dto = new CurrentStreakResponseDto();
        dto.currentStreak = currentStreak;
        return dto;
    }
}
