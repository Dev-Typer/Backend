import { UserRole } from '../../user/enums/user-role.enum';

export interface JwtUser {
  userId: number;
  username: string;
  role: UserRole;
}
