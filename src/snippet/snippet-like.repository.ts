import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SnippetLike } from './entities/snippet-like.entity';

@Injectable()
export class SnippetLikeRepository {
  constructor(
    @InjectRepository(SnippetLike)
    private readonly repo: Repository<SnippetLike>,
  ) {}

  // INSERT ON CONFLICT DO NOTHING — affected rows > 0 이면 실제 삽입
  async insertIfNotExists(userId: number, snippetId: number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(SnippetLike)
      .values({ userId, snippetId })
      .orIgnore()
      .execute();
    return result.raw.length > 0;
  }

  // DELETE — affected rows > 0 이면 실제 삭제
  async deleteIfExists(userId: number, snippetId: number): Promise<boolean> {
    const result = await this.repo.delete({ userId, snippetId });
    return (result.affected ?? 0) > 0;
  }

  // 목록 조회 시 isLiked 배치 처리 — N+1 방지
  // 주어진 snippetIds 중 userId가 좋아요한 것만 반환
  async findLikedSnippetIds(userId: number, snippetIds: number[]): Promise<number[]> {
    if (!snippetIds.length) return [];
    const rows = await this.repo.find({
      where: { userId, snippetId: In(snippetIds) },
      select: { snippetId: true },
    });
    return rows.map(r => r.snippetId);
  }

  // likedByMe 필터용 — userId가 좋아요한 전체 snippetId 목록
  async findAllLikedSnippetIds(userId: number): Promise<number[]> {
    const rows = await this.repo.find({
      where: { userId },
      select: { snippetId: true },
    });
    return rows.map(r => r.snippetId);
  }

  async existsByUserAndSnippet(userId: number, snippetId: number): Promise<boolean> {
    return this.repo.existsBy({ userId, snippetId });
  }
}
