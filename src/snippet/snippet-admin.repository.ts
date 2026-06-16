import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from './snippet.entity';

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

    async save(snippet: Snippet): Promise<Snippet> {
        return this.repo.save(snippet);
    }
}
