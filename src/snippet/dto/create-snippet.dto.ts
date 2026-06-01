import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { SnippetLanguage } from '../enums/snippet-language.enum';
import { SnippetDifficulty } from '../enums/snippt-difficulty.enum';

export class CreateSnippetDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsEnum(SnippetLanguage)
  language!: SnippetLanguage;

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
