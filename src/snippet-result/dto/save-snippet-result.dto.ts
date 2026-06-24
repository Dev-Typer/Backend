import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TypoData } from '../types/typo-data.interface';
import { ReplayEvent } from '../types/replay-event.interface';

class TypoDataDto implements TypoData {
  @IsInt()
  index!: number;

  @IsString()
  @MaxLength(10)
  expected!: string;

  @IsString()
  @MaxLength(10)
  typed!: string;
}

class ReplayEventDto implements ReplayEvent {
  @IsInt()
  index!: number;

  @IsString()
  @MaxLength(5)
  char!: string;

  @IsInt()
  @Min(0)
  timestamp!: number;

  @IsBoolean()
  correct!: boolean;
}

export class SaveSnippetResultDto {
  @IsInt()
  snippetId!: number;

  @IsNumber()
  @Min(0.1)
  @Max(9999)
  wpm!: number;

  @IsNumber()
  @Min(0.1)
  @Max(9999)
  rawWpm!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  accuracy!: number;

  @IsInt()
  @Min(1)
  @Max(3600)
  durationSec!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TypoDataDto)
  typos?: TypoDataDto[] = [];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ReplayEventDto)
  replayData?: ReplayEventDto[] = [];
}
