import { Language } from '../common/types/language.type';

export interface BadgeDefinition {
    code:     string;
    category: 'language';
    name:     string;
    language: Language;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    { code: 'lang_javascript', category: 'language', name: 'JavaScript 뱃지', language: Language.JavaScript },
    { code: 'lang_typescript', category: 'language', name: 'TypeScript 뱃지', language: Language.TypeScript },
    { code: 'lang_python',     category: 'language', name: 'Python 뱃지',     language: Language.Python },
    { code: 'lang_java',       category: 'language', name: 'Java 뱃지',       language: Language.Java },
    { code: 'lang_go',         category: 'language', name: 'Go 뱃지',         language: Language.Go },
    { code: 'lang_cpp',        category: 'language', name: 'C++ 뱃지',        language: Language.Cpp },
    { code: 'lang_csharp',     category: 'language', name: 'C# 뱃지',         language: Language.CSharp },
    { code: 'lang_c',          category: 'language', name: 'C 뱃지',          language: Language.C },
    { code: 'lang_rust',       category: 'language', name: 'Rust 뱃지',       language: Language.Rust },
    { code: 'lang_kotlin',     category: 'language', name: 'Kotlin 뱃지',     language: Language.Kotlin },
];

export function findLanguageBadge(language: Language): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find(b => b.language === language);
}

export function findBadgeName(code: string): string | undefined {
    return BADGE_DEFINITIONS.find(b => b.code === code)?.name;
}
