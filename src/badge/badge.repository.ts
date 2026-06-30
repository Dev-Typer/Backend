import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBadge } from './entities/user-badge.entity';

@Injectable()
export class BadgeRepository {
    constructor(
        @InjectRepository(UserBadge)
        private readonly repo: Repository<UserBadge>,
    ) {}

    async findByUserId(userId: number): Promise<UserBadge[]> {
        return this.repo.find({ where: { userId }, order: { earnedAt: 'ASC' } });
    }

    // unique(userId, badgeCode) 제약으로 중복 부여는 자동 무시됨
    async award(userId: number, badgeCode: string): Promise<void> {
        await this.repo
            .createQueryBuilder()
            .insert()
            .into(UserBadge)
            .values({ userId, badgeCode })
            .orIgnore()
            .execute();
    }
}
