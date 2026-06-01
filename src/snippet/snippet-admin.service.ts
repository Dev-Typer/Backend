import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from './snippet.entity';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { SnippetResponseDto } from './dto/snippet-response.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { SnippetError } from '../common/exceptions/error-code';

@Injectable()
export class SnippetAdminService {
    constructor(
        @InjectRepository(Snippet)
        private snippetRepository: Repository<Snippet>,
    ) {}

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
        Object.assign(snippet, changes);
        const saved = await this.snippetRepository.save(snippet);
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
