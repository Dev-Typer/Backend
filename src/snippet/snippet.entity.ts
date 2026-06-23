import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Language } from '../common/types/language.type';
import { SnippetDifficulty } from './enums/snippt-difficulty.enum';

@Entity()
export class Snippet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'enum', enum: Language })
  language!: Language;

  @Column({ type: 'enum', enum: SnippetDifficulty })
  difficulty!: SnippetDifficulty;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  source!: string | null;

  @Column({ type: 'float', default: 0 })
  avgWpm!: number;

  @Column({ default: 0 })
  playCount!: number;

  @Column({ default: true })
  isActive! : boolean;

  @CreateDateColumn()
  createdAt!: Date;
}