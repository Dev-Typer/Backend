import { Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { SnippetRepository } from './snippet.repository';
import { SnippetLikeRepository } from '../snippet-like.repository';
import { SnippetQueryDto } from '../dto/snippet-query.dto';
import { SnippetResponseDto } from '../dto/snippet-response.dto';
import { SnippetLikeResponseDto } from '../dto/snippet-like-response.dto';
import { Language } from '../../common/types/language.type';
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
        private readonly snippetLikeRepository: SnippetLikeRepository,
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

        return { data: items.map(s => SnippetResponseDto.from(s)), total, page, size };
    }

    // 단건 조회 — 활성화된 스니펫만 반환
    async findOne(id: number): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findActiveById(id);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    // 솔로 연습용 — 활성화된 스니펫 중 랜덤 1개 반환
    async findRandom(language?: Language, difficulty?: SnippetDifficulty): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findRandom(language, difficulty);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    // 좋아요 추가 — 이미 좋아요 상태면 현재 상태 그대로 반환 (멱등)
    @Transactional()
    async like(snippetId: number, userId: number): Promise<SnippetLikeResponseDto> {
        const snippet = await this.snippetRepository.findActiveById(snippetId);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

        const inserted = await this.snippetLikeRepository.insertIfNotExists(userId, snippetId);
        if (inserted) await this.snippetRepository.incrementLikeCount(snippetId);

        return { likeCount: snippet.likeCount + (inserted ? 1 : 0), isLiked: true };
    }

    // 좋아요 취소 — 이미 취소 상태면 현재 상태 그대로 반환 (멱등)
    @Transactional()
    async unlike(snippetId: number, userId: number): Promise<SnippetLikeResponseDto> {
        const snippet = await this.snippetRepository.findActiveById(snippetId);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

        const deleted = await this.snippetLikeRepository.deleteIfExists(userId, snippetId);
        if (deleted) await this.snippetRepository.decrementLikeCount(snippetId);

        return { likeCount: Math.max(0, snippet.likeCount - (deleted ? 1 : 0)), isLiked: false };
    }
}
