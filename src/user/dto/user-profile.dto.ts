import { User } from '../user.entity';
import { UserRole } from '../enums/user-role.enum';

export class UserProfileDto {
    userId!: number;
    username!: string;
    role!: UserRole;
    createdAt!: Date;
    profileUrl!: string | null;
    bannerUrl!: string | null;

    static from(user: User): UserProfileDto {
        const dto       = new UserProfileDto();
        dto.userId      = user.id;
        dto.username    = user.username;
        dto.role        = user.role;
        dto.createdAt   = user.createdAt;
        dto.profileUrl  = user.profileUrl;
        dto.bannerUrl   = user.bannerUrl;
        return dto;
    }
}
