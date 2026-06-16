import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Snippet } from "../../snippet/snippet.entity";

@Entity()
export class DailyChallenge {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne( () => Snippet)
    @JoinColumn({ name: 'snippetId' })
    snippet!: Snippet;

    @Column()
    snippetId!: number;
    
    @Column({ type: 'date', unique: true })
    date!: string; // PostgreSQL date 타입은 'YYYY-MM-DD' 문자열로 반환

    @CreateDateColumn()
    createdAt!: Date;
}