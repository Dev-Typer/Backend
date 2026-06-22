import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { GithubProfileDto } from '../auth/dto/github-profile.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}
    
}
