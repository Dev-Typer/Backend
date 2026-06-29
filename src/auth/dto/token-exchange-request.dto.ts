import { IsNotEmpty, IsString } from 'class-validator';

export class TokenExchangeRequestDto {
    @IsString()
    @IsNotEmpty()
    code!: string;
}
