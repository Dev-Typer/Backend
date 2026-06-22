import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserCoreDto, UserSnippetInfo } from './dto/user-core.dto';
import { SnippetResultRepository } from 'src/snippet-result/snippet-result.repository';
import { calculateTotalCore } from 'src/common/utils/core-calculator.util';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
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
        const totalCore   = calculateTotalCore(snippetList.map(s => s.core));

        return UserCoreDto.builder()
            .userId(userId)
            .totalCore(totalCore)
            .snippetCount(snippetList.length)
            .snippetList(snippetList)
            .build();
    }
}
