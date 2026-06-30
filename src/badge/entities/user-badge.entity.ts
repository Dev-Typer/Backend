import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Unique,
    Index,
} from 'typeorm';

@Entity()
@Unique(['userId', 'badgeCode'])
@Index(['userId'])
export class UserBadge {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @Column()
    badgeCode!: string;

    @CreateDateColumn()
    earnedAt!: Date;
}
