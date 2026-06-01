import { IsArray, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TypoData } from '../types/typo-data.interface';
import { ReplayEvent } from '../types/replay-event.interface';

export class SaveSnippetResultDto {
  @IsInt()
  snippetId!: number;

  @IsNumber()
  @Min(0.1)
  @Max(300)
  wpm!: number;

  @IsNumber()
  @Min(0.1)
  rawWpm!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy!: number;

  @IsInt()
  @Min(3)
  durationSec!: number;

  @IsOptional()
  @IsArray()
  typos?: TypoData[] = [];

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  replayData?: ReplayEvent[] = [];
}
