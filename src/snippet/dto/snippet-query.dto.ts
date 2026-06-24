import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';

export type SnippetSortOption = 'newest' | 'oldest' | 'most-liked' | 'least-liked';
export type PlayedByMeOption = 'played' | 'not-played';

export class SnippetQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.filter((v: string) => Object.values(Language).includes(v as Language)) as Language[];
  })
  language?: Language[];

  @IsOptional()
  @IsEnum(SnippetDifficulty)
  difficulty?: SnippetDifficulty;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most-liked', 'least-liked'])
  sort?: SnippetSortOption = 'newest';

  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  likedByMe?: boolean;

  @IsOptional()
  @IsEnum(['played', 'not-played'])
  playedByMe?: PlayedByMeOption;

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
  @IsEnum(Language)
  language?: Language;

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
