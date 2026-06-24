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

    // 활성화된 스니펫 목록 조회 — 검색/필터/정렬
    async findAll(query: SnippetQueryDto, userId?: number): Promise<SnippetListResponse> {
        const { page = 1, size = 10 } = query;

        const [items, total] = await this.snippetRepository.findActiveList(query, userId);

        // isLiked 배치 처리 — N+1 방지, 총 쿼리 2회
        const likedIds = userId && items.length
            ? new Set(await this.snippetLikeRepository.findLikedSnippetIds(userId, items.map(s => s.id)))
            : new Set<number>();

        return {
            data: items.map(s => SnippetResponseDto.from(s, likedIds.has(s.id))),
            total,
            page,
            size,
        };
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

    @Transactional()
    async like(snippetId: number, userId: number): Promise<SnippetLikeResponseDto> {
        const snippet = await this.snippetRepository.findActiveById(snippetId);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        const inserted = await this.snippetLikeRepository.insertIfNotExists(userId, snippetId);
        if (inserted) await this.snippetRepository.incrementLikeCount(snippetId);
        const updated = await this.snippetRepository.findActiveById(snippetId);
        const dto = new SnippetLikeResponseDto();
        dto.likeCount = updated!.likeCount;
        dto.isLiked = true;
        return dto;
    }

    @Transactional()
    async unlike(snippetId: number, userId: number): Promise<SnippetLikeResponseDto> {
        const snippet = await this.snippetRepository.findActiveById(snippetId);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        const deleted = await this.snippetLikeRepository.deleteIfExists(userId, snippetId);
        if (deleted) await this.snippetRepository.decrementLikeCount(snippetId);
        const updated = await this.snippetRepository.findActiveById(snippetId);
        const dto = new SnippetLikeResponseDto();
        dto.likeCount = updated!.likeCount;
        dto.isLiked = false;
        return dto;
    }
}
