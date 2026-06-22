import { Injectable } from '@nestjs/common';
import { SnippetAdminRepository } from './snippet-admin.repository';
import { CreateSnippetDto } from '../dto/create-snippet.dto';
import { UpdateSnippetDto } from '../dto/update-snippet.dto';
import { SnippetResponseDto } from '../dto/snippet-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { SnippetError } from '../../common/exceptions/error-code';

@Injectable()
export class SnippetAdminService {
    constructor(
        private readonly snippetAdminRepository: SnippetAdminRepository,
    ) {}

    async create(dto: CreateSnippetDto): Promise<SnippetResponseDto> {
        const snippet = await this.snippetAdminRepository.save(
            this.snippetAdminRepository.createEntity(dto),
        );
        return SnippetResponseDto.from(snippet);
    }

    async findById(id: number): Promise<SnippetResponseDto> {
        const snippet = await this.snippetAdminRepository.findById(id);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        return SnippetResponseDto.from(snippet);
    }

    async update(id: number, dto: UpdateSnippetDto): Promise<SnippetResponseDto> {
        const snippet = await this.snippetAdminRepository.findById(id);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);

        Object.assign(snippet, Object.fromEntries(
            Object.entries(dto).filter(([, v]) => v !== undefined),
        ));

        const saved = await this.snippetAdminRepository.save(snippet);
        return SnippetResponseDto.from(saved);
    }

    async deactivate(id: number): Promise<void> {
        const snippet = await this.snippetAdminRepository.findById(id);
        if (!snippet) throw new BusinessException(SnippetError.NOT_FOUND);
        if (!snippet.isActive) return;
        snippet.isActive = false;
        await this.snippetAdminRepository.save(snippet);
    }
}
