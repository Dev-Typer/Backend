import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SnippetLanguage } from '../enums/snippet-language.enum';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';

export class SnippetQueryDto {
  @IsOptional()
  @IsEnum(SnippetLanguage)
  language?: SnippetLanguage;

  @IsOptional()
  @IsEnum(SnippetDifficulty)
  difficulty?: SnippetDifficulty;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  size?: number = 10;
}

// 랜덤 스니펫 조회용 — 언어/난이도 필터만
export class RandomSnippetQueryDto {
  @IsOptional()
  @IsEnum(SnippetLanguage)
  language?: SnippetLanguage;

  @IsOptional()
  @IsEnum(SnippetDifficulty)
  difficulty?: SnippetDifficulty;
}

// 어드민 목록 조회용 — isActive 필터 포함
export class AdminSnippetQueryDto extends SnippetQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  isActive?: boolean;
}
