import { Language } from '../../common/types/language.type';

export class LangCoreEntry {
    language!: Language;
    snippetCount!: number;
    totalCore!: number;
}

export class UserCoreByLanguageDto {
    userId!: number;
    byLanguage!: LangCoreEntry[];
}
