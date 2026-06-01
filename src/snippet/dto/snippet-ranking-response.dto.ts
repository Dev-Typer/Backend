export class SnippetRankingItemDto {
  rank!: number;
  userId!: number;
  username!: string;
  wpm!: number;
  accuracy!: number;
  createdAt!: Date;
}

export class SnippetRankingResponseDto {
  items!: SnippetRankingItemDto[];
  total!: number;
}
