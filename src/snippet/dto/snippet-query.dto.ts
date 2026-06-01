import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
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
  @Max(100)
  limit?: number = 20;
}
