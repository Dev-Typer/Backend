import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../../snippet/enums/snippt-difficulty.enum';
import { SnippetResult } from '../../snippet-result/entities/snippet-result.entity';

export class UserSnippetInfo {
    snippetId!: number;
    title!: string;
    language!: Language;
    difficulty!: SnippetDifficulty;
    core!: number;

    static from(result: SnippetResult): UserSnippetInfo {
        const info = new UserSnippetInfo();
        info.snippetId  = result.snippetId;
        info.title      = result.snippet.title;
        info.language   = result.snippet.language;
        info.difficulty = result.snippet.difficulty;
        info.core       = Number(result.core);
        return info;
    }
}

export class UserCoreDto {
    userId!: number;
    totalCore!: number;
    snippetCount!: number;
    snippetList!: UserSnippetInfo[];

    static builder(): UserCoreDtoBuilder {
        return new UserCoreDtoBuilder();
    }
}

class UserCoreDtoBuilder {
    private readonly dto = new UserCoreDto();

    userId(v: number): this          { this.dto.userId       = v; return this; }
    totalCore(v: number): this       { this.dto.totalCore    = v; return this; }
    snippetCount(v: number): this    { this.dto.snippetCount = v; return this; }
    snippetList(v: UserSnippetInfo[]): this { this.dto.snippetList = v; return this; }

    build(): UserCoreDto { return this.dto; }
}
