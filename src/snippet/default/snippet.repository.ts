import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from '../snippet.entity';
import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';
import type { SnippetQueryDto, SnippetSortOption } from '../dto/snippet-query.dto';

@Injectable()
export class SnippetRepository {
    constructor(
        @InjectRepository(Snippet)
        private readonly repo: Repository<Snippet>,
    ) {}

    // 활성화된 스니펫 목록 — 검색/필터/정렬/페이지네이션
    async findActiveList(
        query: SnippetQueryDto,
        userId?: number,
    ): Promise<[Snippet[], number]> {
        const { language, difficulty, keyword, sort = 'newest', likedByMe, playedByMe, page = 1, size = 10 } = query;

        const qb = this.repo
            .createQueryBuilder('snippet')
            .where('snippet.isActive = true');

        // 언어 / 난이도 필터
        if (language)   qb.andWhere('snippet.language = :language', { language });
        if (difficulty) qb.andWhere('snippet.difficulty = :difficulty', { difficulty });

        // 제목 검색 (대소문자 무시)
        if (keyword?.trim()) {
            qb.andWhere('snippet.title ILIKE :keyword', { keyword: `%${keyword.trim()}%` });
        }

        // 내가 좋아요한 스니펫만 (로그인 상태일 때만 적용)
        if (likedByMe && userId) {
            qb.andWhere(qb2 =>
                'snippet.id IN ' + qb2
                    .subQuery()
                    .select('sl.snippetId')
                    .from('snippet_like', 'sl')
                    .where('sl.userId = :userId', { userId })
                    .getQuery()
            );
        }

        // 내가 플레이한 / 안 한 스니펫 (로그인 상태일 때만 적용)
        if (playedByMe && userId) {
            if (playedByMe === 'played') {
                qb.andWhere(qb2 =>
                    'snippet.id IN ' + qb2
                        .subQuery()
                        .select('DISTINCT sr.snippetId')
                        .from('snippet_result', 'sr')
                        .where('sr.userId = :userId', { userId })
                        .getQuery()
                );
            } else {
                qb.andWhere(qb2 =>
                    'snippet.id NOT IN ' + qb2
                        .subQuery()
                        .select('DISTINCT sr.snippetId')
                        .from('snippet_result', 'sr')
                        .where('sr.userId = :userId', { userId })
                        .getQuery()
                );
            }
        }

        // 정렬
        this.applySort(qb, sort);

        return qb
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();
    }

    private applySort(qb: ReturnType<typeof this.repo.createQueryBuilder>, sort: SnippetSortOption) {
        switch (sort) {
            case 'oldest':      qb.orderBy('snippet.createdAt', 'ASC'); break;
            case 'most-liked':  qb.orderBy('snippet.likeCount', 'DESC').addOrderBy('snippet.createdAt', 'DESC'); break;
            case 'least-liked': qb.orderBy('snippet.likeCount', 'ASC').addOrderBy('snippet.createdAt', 'DESC'); break;
            default:            qb.orderBy('snippet.createdAt', 'DESC'); // newest
        }
    }

    // 단건 조회 — 활성화 여부 필터 옵션
    async findActiveById(id: number): Promise<Snippet | null> {
        return this.repo.findOne({ where: { id, isActive: true } });
    }

    // 전체 단건 조회 (admin용, isActive 무관)
    async findById(id: number): Promise<Snippet | null> {
        return this.repo.findOne({ where: { id } });
    }

    // 랜덤 1개 조회
    async findRandom(language?: Language, difficulty?: SnippetDifficulty): Promise<Snippet | null> {
        const qb = this.repo
            .createQueryBuilder('snippet')
            .where('snippet.isActive = true')
            .orderBy('RANDOM()');

        if (language)   qb.andWhere('snippet.language = :language', { language });
        if (difficulty) qb.andWhere('snippet.difficulty = :difficulty', { difficulty });

        return qb.getOne();
    }

    // 스니펫 생성
    createEntity(data: Partial<Snippet>): Snippet {
        return this.repo.create(data);
    }

    async save(snippet: Snippet): Promise<Snippet> {
        return this.repo.save(snippet);
    }

    // 활성화된 스니펫 전체 조회 — daily 후보 선정 시 사용 (페이지네이션 없음)
    async findAllActive(): Promise<Snippet[]> {
        return this.repo.find({ where: { isActive: true } });
    }

    async incrementLikeCount(snippetId: number): Promise<void> {
        await this.repo.increment({ id: snippetId }, 'likeCount', 1);
    }

    async decrementLikeCount(snippetId: number): Promise<void> {
        await this.repo
            .createQueryBuilder()
            .update(Snippet)
            .set({ likeCount: () => 'GREATEST("likeCount" - 1, 0)' })
            .where('id = :id', { id: snippetId })
            .execute();
    }

    // 결과 저장 시 playCount +1, avgWpm 갱신
    async incrementStats(snippetId: number, wpm: number): Promise<void> {
        await this.repo
            .createQueryBuilder()
            .update(Snippet)
            .set({
                playCount: () => '"playCount" + 1',
                avgWpm: () => 'ROUND(((("avgWpm" * "playCount") + :wpm) / ("playCount" + 1))::numeric, 1)',
            })
            .where('id = :id', { id: snippetId })
            .setParameter('wpm', wpm)
            .execute();
    }
}
