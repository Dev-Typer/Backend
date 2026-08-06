import { Injectable } from '@nestjs/common';
import { BadgeRepository } from './badge.repository';
import { findLanguageBadge, findBadgeName } from './badge.definitions';
import { Language } from '../common/types/language.type';
import { UserBadgeDto, UserBadgeListResponseDto } from './dto/user-badge-response.dto';

@Injectable()
export class BadgeService {
    constructor(
        private readonly badgeRepository: BadgeRepository,
    ) {}

    async awardLanguageBadge(userId: number, language: Language): Promise<void> {
        const badge = findLanguageBadge(language);
        if (!badge) return;
        await this.badgeRepository.award(userId, badge.code);
    }

    async getUserBadges(userId: number): Promise<UserBadgeListResponseDto> {
        const earned = await this.badgeRepository.findByUserId(userId);

        const dto = new UserBadgeListResponseDto();
        dto.badges = earned.map((e) => {
            const item     = new UserBadgeDto();
            item.code      = e.badgeCode;
            item.name      = findBadgeName(e.badgeCode) ?? e.badgeCode;
            item.earnedAt  = e.earnedAt;
            return item;
        });
        return dto;
    }
}
