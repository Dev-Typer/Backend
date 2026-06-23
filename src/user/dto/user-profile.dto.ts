import { User } from '../user.entity';

export class UserProfileDto {
    userId!: number;
    username!: string;
    createdAt!: Date;
    profileUrl!: string | null;
    bannerUrl!: string | null;

    static from(user: User): UserProfileDto {
        const dto       = new UserProfileDto();
        dto.userId      = user.id;
        dto.username    = user.username;
        dto.createdAt   = user.createdAt;
        dto.profileUrl  = user.profileUrl;
        dto.bannerUrl   = user.bannerUrl;
        return dto;
    }
}
