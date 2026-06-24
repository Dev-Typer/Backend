import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('snippet_like')
export class SnippetLike {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  snippetId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
