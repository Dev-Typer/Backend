import { User } from '../user.entity';

export class UserMeResponseDto {
    username!: string;
    profileUrl!: string | null;
    bannerUrl!: string | null;
    totalCore!: number;
    currentStreak!: number;

    static from(
        user: User,
        totalCore: number,
        currentStreak: number,
    ): UserMeResponseDto {
        const dto            = new UserMeResponseDto();
        dto.username         = user.username;
        dto.profileUrl       = user.profileUrl;
        dto.bannerUrl        = user.bannerUrl;
        dto.totalCore        = totalCore;
        dto.currentStreak    = currentStreak;
        return dto;
    }
}
