import { Injectable } from '@nestjs/common';
import { UserCoreDto, UserSnippetInfo } from './dto/user-core.dto';
import { UserCoreByLanguageDto, LangCoreEntry } from './dto/user-core-by-language.dto';
import type { UserCoreHistoryDto, CoreHistoryPoint } from './dto/user-core-history.dto';
import { SnippetResultRepository } from 'src/snippet-result/snippet-result.repository';
import { Language } from 'src/common/types/language.type';

@Injectable()
export class UserService {
    constructor(
        private readonly snippetResultRepository: SnippetResultRepository,
    ) {}

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
