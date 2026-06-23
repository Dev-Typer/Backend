import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';

export class CreateSnippetDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsEnum(Language)
  language!: Language;

  @IsEnum(SnippetDifficulty)
  difficulty!: SnippetDifficulty;

  @Transform(({ value }) => (value as string).replace(/\r\n/g, '\n'))
  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  source?: string;
}
