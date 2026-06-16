import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { GithubProfileDto } from '../auth/dto/github-profile.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async findByGithubId(githubId: string): Promise<User | null> {
        return this.userRepository.findByGithubId(githubId);
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async create(profile: GithubProfileDto): Promise<User> {
        return this.userRepository.create(profile);
    }
}
