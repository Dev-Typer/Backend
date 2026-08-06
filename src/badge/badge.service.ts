import { Injectable } from '@nestjs/common';
import { BadgeRepository } from './badge.repository';
import { findLanguageBadge, findBadgeName } from './badge.definitions';
import { Language } from '../common/types/language.type';
import { UserBadgeDto, UserBadgeListResponseDto, PublicBadgeItem, PublicBadgeListResponseDto } from './dto/user-badge-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { BadgeError } from '../common/exceptions/error-code';

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
            const item          = new UserBadgeDto();
            item.code           = e.badgeCode;
            item.name           = findBadgeName(e.badgeCode) ?? e.badgeCode;
            item.earnedAt       = e.earnedAt;
            item.isFeatured     = e.isFeatured;
            item.featuredOrder  = e.featuredOrder;
            return item;
        });
        return dto;
    }

    async getFeaturedBadges(userId: number): Promise<PublicBadgeListResponseDto> {
        const featured = await this.badgeRepository.findFeaturedByUserId(userId);

        const dto = new PublicBadgeListResponseDto();
        dto.badges = featured.map((e) => {
            const item    = new PublicBadgeItem();
            item.code     = e.badgeCode;
            item.name     = findBadgeName(e.badgeCode) ?? e.badgeCode;
            item.earnedAt = e.earnedAt;
            return item;
        });
        return dto;
    }

    async updateFeaturedBadges(userId: number, badgeCodes: string[]): Promise<void> {
        if (badgeCodes.length > 8) {
            throw new BusinessException(BadgeError.DISPLAY_LIMIT_EXCEEDED);
        }

        const unique = new Set(badgeCodes);
        if (unique.size !== badgeCodes.length) {
            throw new BusinessException(BadgeError.DUPLICATE_CODE);
        }

        if (badgeCodes.length > 0) {
            const owned = await this.badgeRepository.findByUserId(userId);
            const ownedCodes = new Set(owned.map(b => b.badgeCode));
            for (const code of badgeCodes) {
                if (!ownedCodes.has(code)) {
                    throw new BusinessException(BadgeError.NOT_OWNED);
                }
            }
        }

        await this.badgeRepository.updateFeatured(userId, badgeCodes);
    }
}
