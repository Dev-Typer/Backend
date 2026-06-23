import { Injectable } from '@nestjs/common';
import { UserCoreDto, UserSnippetInfo } from './dto/user-core.dto';
import type { UserCoreHistoryDto, CoreHistoryPoint } from './dto/user-core-history.dto';
import { SnippetResultRepository } from 'src/snippet-result/snippet-result.repository';

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
