import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Snippet } from '../snippet.entity';
import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';

@Injectable()
export class SnippetAdminRepository {
    constructor(
        @InjectRepository(Snippet)
        private readonly repo: Repository<Snippet>,
    ) {}

    async findById(id: number): Promise<Snippet | null> {
        return this.repo.findOne({ where: { id } });
    }

    createEntity(data: Partial<Snippet>): Snippet {
        return this.repo.create(data);
    }

    async findAll(
        language?: Language,
        difficulty?: SnippetDifficulty,
        isActive?: boolean,
        page: number = 1,
        size: number = 10,
    ): Promise<[Snippet[], number]> {
        const where: FindOptionsWhere<Snippet> = {};
        if (language !== undefined)   where.language   = language;
        if (difficulty !== undefined) where.difficulty = difficulty;
        if (isActive !== undefined)   where.isActive   = isActive;

        return this.repo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * size,
            take: size,
        });
    }

    async save(snippet: Snippet): Promise<Snippet> {
        return this.repo.save(snippet);
    }
}
