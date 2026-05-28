import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { GithubProfileDto } from './dto/github-profile.dto';
@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
    ) {}

    async findOrCreateUser(profile: GithubProfileDto): Promise<User> {
        let user = await this.userService.findByGithubId(profile.githubId);
        if (!user) {
            user = await this.userService.create(profile);
        }
        return user;
    }
}
