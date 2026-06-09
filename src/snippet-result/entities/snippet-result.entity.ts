import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Snippet } from '../../snippet/snippet.entity';
import { ReplayEvent } from '../types/replay-event.interface';
import { TypoData } from '../types/typo-data.interface';

@Entity()
export class SnippetResult {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne( () => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: number;

    @ManyToOne( () => Snippet, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'snippetId' })
    snippet!: Snippet; 

    @Column()
    snippetId!: number;

    @Column({ type: 'float' })
    wpm!: number;

    @Column({ type: 'float' })
    rawWpm!: number;

    @Column({ type: 'float' })
    accuracy!: number;

    @Column()
    durationSec!: number;

    @Column({ type: 'jsonb', default: [] })
    typos!: TypoData[];

    @Column({ type : 'decimal', precision: 10, scale: 4})
    nWpm!: number;

    @Column({ default: false})
    isDaily!: boolean;

    @Column({ type: 'jsonb', default: [] })
    replayData!: ReplayEvent[];

    @CreateDateColumn()
    createdAt!: Date;
}