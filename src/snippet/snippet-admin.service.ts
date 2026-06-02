import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Snippet } from './snippet.entity';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { AdminSnippetQueryDto } from './dto/snippet-query.dto';
import { SnippetResponseDto } from './dto/snippet-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError } from '../common/exceptions/error-code';

@Injectable()
export class SnippetAdminService {
    constructor(
        @InjectRepository(Snippet)
        private snippetRepository: Repository<Snippet>,
        private dataSource: DataSource,
    ) {}

    // 어드민 목록 조회 — isActive 필터 포함, 비활성 스니펫도 조회 가능
    async findAll(query: AdminSnippetQueryDto): Promise<{ data: SnippetResponseDto[]; total: number; page: number; size: number }> {
        const { language, difficulty, isActive, page = 1, size = 20 } = query;

        const qb = this.snippetRepository
            .createQueryBuilder('snippet')
            .orderBy('snippet.createdAt', 'DESC');

        if (language)               qb.andWhere('snippet.language = :language', { language });
        if (difficulty)             qb.andWhere('snippet.difficulty = :difficulty', { difficulty });
        if (isActive !== undefined) qb.andWhere('snippet.isActive = :isActive', { isActive });

        const [items, total] = await qb
            .skip((page - 1) * size)
            .take(size)
            .getManyAndCount();

        return { data: items.map(SnippetResponseDto.from), total, page, size };
    }

    async create(dto: CreateSnippetDto): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.save(
            this.snippetRepository.create(dto),
        );
        return SnippetResponseDto.from(snippet);
    }

    async findById(id: number): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findOne({ where: { id } });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    async update(id: number, dto: UpdateSnippetDto): Promise<SnippetResponseDto> {
        const snippet = await this.snippetRepository.findOne({ where: { id } });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

        const changes = Object.fromEntries(
            Object.entries(dto).filter(([, v]) => v !== undefined),
        );

        const saved = await this.dataSource.transaction(async (manager) => {
            // isDaily: true로 변경 시 기존 daily 스니펫 해제
            if (changes.isDaily === true) {
                await manager.update(Snippet, { isDaily: true }, { isDaily: false });
            }
            Object.assign(snippet, changes);
            return manager.save(Snippet, snippet);
        });

        return SnippetResponseDto.from(saved);
    }

    async deactivate(id: number): Promise<void> {
        const snippet = await this.snippetRepository.findOne({ where: { id } });
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        if (!snippet.isActive) return;
        snippet.isActive = false;
        await this.snippetRepository.save(snippet);
    }
}
