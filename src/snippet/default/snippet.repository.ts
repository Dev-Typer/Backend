import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from '../snippet.entity';
import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';

@Injectable()
export class SnippetRepository {
    constructor(
        @InjectRepository(Snippet)
        private readonly repo: Repository<Snippet>,
    ) {}

    // 활성화된 스니펫 목록 — 페이지네이션 + 필터
    async findActiveList(
        language?: Language,
        difficulty?: SnippetDifficulty,
        page = 1,
        size = 10,
    ): Promise<[Snippet[], number]> {
        const qb = this.repo
            .createQueryBuilder('snippet')
            .where('snippet.isActive = true')
            .orderBy('snippet.createdAt', 'DESC');

        if (language)   qb.andWhere('snippet.language = :language', { language });
        if (difficulty) qb.andWhere('snippet.difficulty = :difficulty', { difficulty });

        return qb
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();
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
