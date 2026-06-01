// src/snippet-result/snippet-result.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SnippetResult } from './entities/snippet-result.entity';

@Injectable()
export class SnippetResultService {
  constructor(
    @InjectRepository(SnippetResult)
    private snippetResultRepository: Repository<SnippetResult>,
  ) {}

  // TODO : #17에서 채울 예정
}