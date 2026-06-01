import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from './snippet.entity';
import { SnippetResponseDto } from './dto/snippet-response.dto';
import { SnippetLanguage } from './enums/snippet-language.enum';
import { SnippetDifficulty } from './enums/snippt-difficulty.enum';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError } from '../common/exceptions/error-code';

@Injectable()
export class SnippetService {
    constructor(
        @InjectRepository(Snippet)
        private snippetRepository: Repository<Snippet>,
    ) {}

    // 솔로 연습용 — 활성화된 스니펫 중 언어/난이도 필터로 랜덤 1개 반환
    async findRandom(language?: SnippetLanguage, difficulty?: SnippetDifficulty): Promise<SnippetResponseDto> {
        const qb = this.snippetRepository
            .createQueryBuilder('snippet')
            .where('snippet.isActive = true')
            .orderBy('RANDOM()');

        if (language)   qb.andWhere('snippet.language = :language', { language });
        if (difficulty) qb.andWhere('snippet.difficulty = :difficulty', { difficulty });

        const snippet = await qb.getOne();
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    // 데일리 챌린지용 — isDaily=true인 활성 스니펫 1개 반환
    async findDaily(): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findOne({
            where: { isDaily: true, isActive: true },
        });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }
}
