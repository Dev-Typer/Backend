import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';
import { Snippet } from '../snippet.entity';

export class SnippetResponseDto {
  id!: number;
  title!: string;
  language!: Language;
  difficulty!: SnippetDifficulty;
  content!: string;
  source!: string | null;
  avgWpm!: number;
  playCount!: number;
  likeCount!: number;
  isLiked!: boolean;
  isActive!: boolean;
  createdAt!: Date;

  static from(snippet: Snippet, isLiked = false): SnippetResponseDto {
    const dto = new SnippetResponseDto();
    dto.id         = snippet.id;
    dto.title      = snippet.title;
    dto.language   = snippet.language;
    dto.difficulty = snippet.difficulty;
    dto.content    = snippet.content;
    dto.source     = snippet.source;
    dto.avgWpm     = snippet.avgWpm;
    dto.playCount  = snippet.playCount;
    dto.likeCount  = snippet.likeCount;
    dto.isLiked    = isLiked;
    dto.isActive   = snippet.isActive;
    dto.createdAt  = snippet.createdAt;
    return dto;
  }
}
