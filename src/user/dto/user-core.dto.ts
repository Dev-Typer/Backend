import { Language } from '../../common/types/language.type';
import { SnippetDifficulty } from '../../snippet/enums/snippt-difficulty.enum';

export class UserCoreDto {
    userId!: number;
    totalCore!: number;
    snippetCount!: number;
    snippetList!: UserSnippetInfo[];
}

export class UserSnippetInfo {
    snippetId!: number;
    title!: string;
    language!: Language;
    difficulty!: SnippetDifficulty;
    core!: number;
    myRank!: number;
    totalUserCount!: number;
}
