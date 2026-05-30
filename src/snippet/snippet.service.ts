import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Snippet } from './snippet.entity';
import { SnippetLanguage } from './enums/snippet-language.enum';
import { SnippetDifficulty } from './enums/snippt-difficulty.enum';

@Injectable()
export class SnippetService {
    constructor(
        @InjectRepository(Snippet)
        private snippetRepository: Repository<Snippet>,
    ) {}

    // TODO: 특정 ID 스니펫 조회
    async findById(id: number): Promise<Snippet | null> {
        throw new Error('TODO');
    }

    // TODO: 언어/난이도 필터로 랜덤 스니펫 1개 반환 (솔로 연습용)
    async findRandom(language?: SnippetLanguage, difficulty?: SnippetDifficulty): Promise<Snippet | null> {
        throw new Error('TODO');
    }

    // TODO: 오늘의 데일리 챌린지 스니펫 반환 (isDaily=true인 것 중 오늘 날짜 기준)
    async findDaily(): Promise<Snippet | null> {
        throw new Error('TODO');
    }

    // TODO: 게임 종료 후 avgWpm, playCount 업데이트
    async updateStats(id: number, wpm: number): Promise<void> {
        throw new Error('TODO');
    }
}
