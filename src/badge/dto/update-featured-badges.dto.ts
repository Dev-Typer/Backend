import { IsArray, IsString, ArrayMaxSize } from 'class-validator';

export class UpdateFeaturedBadgesDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(8)
    badgeCodes!: string[];
}
