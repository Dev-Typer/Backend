import { User } from 'src/user/user.entity';
import { UserRole } from 'src/user/enums/user-role.enum';

export class AuthMeResponseDto {
    userId!: number;
    username!: string;
    role!: UserRole;
    createdAt!: Date;

    static from(user: User): AuthMeResponseDto {
        const dto       = new AuthMeResponseDto();
        dto.userId      = user.id;
        dto.username    = user.username;
        dto.role        = user.role;
        dto.createdAt   = user.createdAt;
        return dto;
    }
}
