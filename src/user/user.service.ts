import { Injectable } from '@nestjs/common';
import { UserCoreDto, UserSnippetInfo } from './dto/user-core.dto';
import { UserCoreByLanguageDto, LangCoreEntry } from './dto/user-core-by-language.dto';
import type { UserCoreHistoryDto, CoreHistoryPoint } from './dto/user-core-history.dto';
import { UserMeResponseDto } from './dto/user-me-response.dto';
import { UserHoverDto } from './dto/user-hover.dto';
import type { UserStreakDto, StreakDayEntry } from './dto/user-streak.dto';
import type { UserWpmHistoryDto } from './dto/user-wpm-history.dto';
import { CurrentStreakResponseDto } from './dto/current-streak-response.dto';
import { SnippetResultRepository } from 'src/snippet-result/snippet-result.repository';
import { UserRepository } from './user.repository';
import { R2StorageService } from 'src/common/storage/r2.service';
import type { ImageFile } from 'src/common/storage/r2.service';
import { Language } from 'src/common/types/language.type';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { UserError } from 'src/common/exceptions/error-code';

@Injectable()
export class UserService {
    constructor(
        private readonly snippetResultRepository: SnippetResultRepository,
        private readonly userRepository: UserRepository,
        private readonly r2: R2StorageService,
    ) {}

    // ─── 프로필 조회 ───────────────────────────────────────────────────────────

    async getUserMe(userId: number): Promise<UserMeResponseDto> {
        const [user, totalCore, currentStreak] = await Promise.all([
            this.userRepository.findById(userId),
            this.snippetResultRepository.getTotalCore(userId),
            this.fetchCurrentStreak(userId),
        ]);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);
        return UserMeResponseDto.from(user, totalCore, currentStreak);
    }

    async getHoverCard(username: string): Promise<UserHoverDto> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);
        const [totalCore, currentStreak] = await Promise.all([
            this.snippetResultRepository.getTotalCore(user.id),
            this.fetchCurrentStreak(user.id),
        ]);
        const globalRank = await this.userRepository.getGlobalRank(totalCore);
        return UserHoverDto.from(user, totalCore, currentStreak, globalRank);
    }

    // ─── 이미지 업로드/삭제 ────────────────────────────────────────────────────

    async uploadProfileImage(userId: number, file: ImageFile | undefined): Promise<{ profileUrl: string }> {
        if (!file) throw new BusinessException(UserError.IMAGE_TYPE_NOT_ALLOWED);

        const user = await this.userRepository.findById(userId);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);

        const { publicUrl } = await this.r2.upload('profile', userId, file);

        await this.userRepository.updateProfileUrl(userId, publicUrl);

        return { profileUrl: publicUrl };
    }

    async deleteProfileImage(userId: number): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);

        if (user.profileUrl) {
            await this.r2.delete(this.r2.extractKey(user.profileUrl));
        }

        await this.userRepository.updateProfileUrl(userId, null);
    }

    async uploadBannerImage(userId: number, file: ImageFile | undefined): Promise<{ bannerUrl: string }> {
        if (!file) throw new BusinessException(UserError.IMAGE_TYPE_NOT_ALLOWED);

        const user = await this.userRepository.findById(userId);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);

        const { publicUrl } = await this.r2.upload('banner', userId, file);

        await this.userRepository.updateBannerUrl(userId, publicUrl);

        return { bannerUrl: publicUrl };
    }

    async deleteBannerImage(userId: number): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);

        if (user.bannerUrl) {
            await this.r2.delete(this.r2.extractKey(user.bannerUrl));
        }

        await this.userRepository.updateBannerUrl(userId, null);
    }

    // ─── Streak ───────────────────────────────────────────────────────────────

    // getMeStreak / getUserMe / getCurrentStreak 공통 로직
    // getStreakDayData dayRows에서 현재 연속 제출일 수 계산
    private static computeCurrentStreak(dayRows: { day: string }[], now: Date): number {
        const todayStr  = now.toISOString().slice(0, 10);
        const submitted = new Set(dayRows.map(r => r.day));
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        let current = 0;
        const check = submitted.has(todayStr) ? new Date(now) : new Date(yesterday);
        while (submitted.has(check.toISOString().slice(0, 10))) {
            current++;
            check.setUTCDate(check.getUTCDate() - 1);
        }
        return current;
    }

    // getUserMe / getCurrentStreak endpoint에서 사용하는 경량 streak fetch
    private async fetchCurrentStreak(userId: number): Promise<number> {
        const now      = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const startStr = new Date(now.getTime() - 364 * 86400 * 1000).toISOString().slice(0, 10);
        const dayRows  = await this.snippetResultRepository.getStreakDayData(userId, startStr, todayStr);
        return UserService.computeCurrentStreak(dayRows, now);
    }

    async getMeStreak(userId: number, year?: number, type?: string): Promise<UserStreakDto> {
        const isRecent = type === 'recent';

        const now       = new Date();
        const todayStr  = now.toISOString().slice(0, 10);
        const startStr  = isRecent
            ? new Date(now.getTime() - 364 * 86400 * 1000).toISOString().slice(0, 10)
            : `${year ?? now.getUTCFullYear()}-01-01`;
        const endStr    = isRecent
            ? todayStr
            : `${year ?? now.getUTCFullYear()}-12-31`;

        const [dayRows, longest] = await Promise.all([
            this.snippetResultRepository.getStreakDayData(userId, startStr, endStr),
            this.snippetResultRepository.getLongestStreak(userId),
        ]);

        const submittedSet = new Map(dayRows.map(r => [r.day, Number(r.wpm)]));

        // 날짜 범위 전체를 순회해 yearData 생성
        const yearData: StreakDayEntry[] = [];
        const cursor = new Date(startStr);
        const endDate = new Date(endStr);

        while (cursor <= endDate) {
            const dateStr = cursor.toISOString().slice(0, 10);
            const wpm     = submittedSet.get(dateStr) ?? null;
            yearData.push({ date: dateStr, submitted: wpm !== null, wpm });
            cursor.setDate(cursor.getDate() + 1);
        }

        const current = UserService.computeCurrentStreak(dayRows, now);

        return {
            userId,
            type:     isRecent ? 'recent' : 'year',
            year:     isRecent ? null : (year ?? now.getUTCFullYear()),
            current,
            longest,
            yearData,
        };
    }

    async getCurrentStreak(userId: number): Promise<CurrentStreakResponseDto> {
        const currentStreak = await this.fetchCurrentStreak(userId);
        return CurrentStreakResponseDto.from(currentStreak);
    }

    // ─── WPM 추이 ─────────────────────────────────────────────────────────────

    async getMeWpmHistory(userId: number): Promise<UserWpmHistoryDto> {
        const MONTHS = 6;
        const rows = await this.snippetResultRepository.getWpmMonthlyHistory(userId, MONTHS);

        const results = rows.map(row => ({
            month:   row.month,
            avgWpm:  Number(row.avg_wpm),
        }));

        return { userId, range: `${MONTHS}m`, results };
    }

    // ─── 공개 프로필 (username 기준) ──────────────────────────────────────────────

    private async resolveUserId(username: string): Promise<number> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) throw new BusinessException(UserError.NOT_FOUND);
        return user.id;
    }

    async getPublicProfile(username: string): Promise<UserMeResponseDto> {
        const userId = await this.resolveUserId(username);
        return this.getUserMe(userId);
    }

    async getPublicStreak(username: string, year?: number, type?: string): Promise<UserStreakDto> {
        const userId = await this.resolveUserId(username);
        return this.getMeStreak(userId, year, type);
    }

    async getPublicWpmHistory(username: string): Promise<UserWpmHistoryDto> {
        const userId = await this.resolveUserId(username);
        return this.getMeWpmHistory(userId);
    }

    async getPublicCoreInfo(username: string): Promise<UserCoreDto> {
        const userId = await this.resolveUserId(username);
        return this.getMyCoreInfo(userId);
    }

    async getPublicCoreByLanguage(username: string): Promise<UserCoreByLanguageDto> {
        const userId = await this.resolveUserId(username);
        return this.getMyCoreByLanguage(userId);
    }

    async getPublicCoreHistory(username: string): Promise<UserCoreHistoryDto> {
        const userId = await this.resolveUserId(username);
        return this.getMyCoreHistory(userId);
    }

    // ─── CORE ─────────────────────────────────────────────────────────────────

    async getMyCoreInfo(userId: number): Promise<UserCoreDto> {
        const results = await this.snippetResultRepository.getTop100BestCoresByUser(userId);

        if (!results.length) {
            return UserCoreDto.builder()
                .userId(userId)
                .totalCore(0)
                .snippetCount(0)
                .snippetList([])
                .build();
        }

        const snippetList = results.map(r => UserSnippetInfo.from(r));
        const totalCore   = snippetList.reduce((sum, s) => sum + s.core, 0);

        return UserCoreDto.builder()
            .userId(userId)
            .totalCore(totalCore)
            .snippetCount(snippetList.length)
            .snippetList(snippetList)
            .build();
    }

    async getMyCoreByLanguage(userId: number): Promise<UserCoreByLanguageDto> {
        const rows = await this.snippetResultRepository.getBestCoresByUserWithLanguage(userId);

        const grouped = new Map<Language, number[]>();
        for (const row of rows) {
            const lang = row.language as Language;
            if (!grouped.has(lang)) grouped.set(lang, []);
            grouped.get(lang)!.push(Number(row.core));
        }

        const byLanguage: LangCoreEntry[] = Object.values(Language).map(lang => {
            const cores = grouped.get(lang) ?? [];
            return {
                language:     lang,
                snippetCount: cores.length,
                totalCore:    cores.reduce((sum, c) => sum + Math.floor(c), 0),
            };
        });

        return { userId, byLanguage };
    }

    async getMyCoreHistory(userId: number): Promise<UserCoreHistoryDto> {
        const MONTHS = 6;
        const rows = await this.snippetResultRepository.getCoreHistoryByMonth(userId, MONTHS);

        const points: CoreHistoryPoint[] = rows.map(row => ({
            date:      String(row.month_start).slice(0, 10),
            totalCore: Math.floor(Number(row.total_core)),
        }));

        return { userId, range: `${MONTHS}m`, points };
    }
}
