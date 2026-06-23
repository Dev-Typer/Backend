import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { GithubProfileDto } from '../auth/dto/github-profile.dto';

@Injectable()
export class UserRepository {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ) {}

    async findByGithubId(githubId: string): Promise<User | null> {
        return this.repo.findOne({ where: { githubId } });
    }

    async findById(id: number): Promise<User | null> {
        return this.repo.findOne({ where: { id } });
    }

    async create(profile: GithubProfileDto): Promise<User> {
        const user = this.repo.create(profile);
        return this.repo.save(user);
    }

    async updateProfileUrl(userId: number, profileUrl: string | null): Promise<void> {
        await this.repo.update(userId, { profileUrl });
    }

    async updateBannerUrl(userId: number, bannerUrl: string | null): Promise<void> {
        await this.repo.update(userId, { bannerUrl });
    }
}
