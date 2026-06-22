import { Injectable } from '@nestjs/common';
import { SnippetRepository } from './snippet.repository';
import { SnippetQueryDto } from '../dto/snippet-query.dto';
import { SnippetResponseDto } from '../dto/snippet-response.dto';
import { SnippetLanguage } from '../enums/snippet-language.enum';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';
import { BusinessException } from '../../common/exceptions/business.exception';
import { SnippetError } from '../../common/exceptions/error-code';

export interface SnippetListResponse {
    data: SnippetResponseDto[];
    total: number;
    page: number;
    size: number;
}

@Injectable()
export class SnippetService {
    constructor(
        private readonly snippetRepository: SnippetRepository,
    ) {}

    // 활성화된 스니펫 목록 조회 — isActive: true 고정
    async findAll(query: SnippetQueryDto): Promise<SnippetListResponse> {
        const { language, difficulty, page = 1, size = 10 } = query;

        const [items, total] = await this.snippetRepository.findActiveList(
            language,
            difficulty,
            page,
            size,
        );

        return { data: items.map(SnippetResponseDto.from), total, page, size };
    }

    // 단건 조회 — 활성화된 스니펫만 반환
    async findOne(id: number): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findActiveById(id);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    // 솔로 연습용 — 활성화된 스니펫 중 랜덤 1개 반환
    async findRandom(language?: SnippetLanguage, difficulty?: SnippetDifficulty): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findRandom(language, difficulty);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }
}
