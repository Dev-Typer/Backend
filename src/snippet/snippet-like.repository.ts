import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  // userId 기준 좋아요한 snippetId 목록 — likedByMe 필터에서 사용
  async findSnippetIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.repo.find({
      where: { userId },
      select: { snippetId: true },
    });
    return rows.map(r => r.snippetId);
  }

  // 특정 유저가 해당 스니펫을 좋아요했는지 여부
  async existsByUserAndSnippet(userId: number, snippetId: number): Promise<boolean> {
    return this.repo.existsBy({ userId, snippetId });
  }
}
