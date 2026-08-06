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

    async findFeaturedByUserId(userId: number): Promise<UserBadge[]> {
        return this.repo.find({
            where: { userId, isFeatured: true },
            order: { featuredOrder: 'ASC' },
        });
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

    // 기존 featured 전체 초기화 후 입력 배열 순서대로 재설정
    async updateFeatured(userId: number, badgeCodes: string[]): Promise<void> {
        await this.repo.update({ userId }, { isFeatured: false, featuredOrder: null });

        if (!badgeCodes.length) return;

        for (let i = 0; i < badgeCodes.length; i++) {
            await this.repo.update(
                { userId, badgeCode: badgeCodes[i] },
                { isFeatured: true, featuredOrder: i },
            );
        }
    }
}
