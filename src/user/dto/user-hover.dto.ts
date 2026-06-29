import { User } from '../user.entity';

export class UserHoverDto {
    username!:      string;
    profileUrl!:    string | null;
    bannerUrl!:     string | null;
    totalCore!:     number;
    avgWpm!:        number;
    currentStreak!: number;
    globalRank!:    number;

    static from(
        user:          User,
        totalCore:     number,
        avgWpm:        number,
        currentStreak: number,
        globalRank:    number,
    ): UserHoverDto {
        const dto        = new UserHoverDto();
        dto.username      = user.username;
        dto.profileUrl    = user.profileUrl;
        dto.bannerUrl     = user.bannerUrl;
        dto.totalCore     = totalCore;
        dto.avgWpm        = avgWpm;
        dto.currentStreak = currentStreak;
        dto.globalRank    = globalRank;
        return dto;
    }
}
