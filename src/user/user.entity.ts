import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    githubId!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({ default: 0 })
    rating!: number;

    @Column({ default: 0 })
    tier!: string; //추후 enum으로 관리할 예정입니다 (아직 티어 기준 미정)

    @CreateDateColumn()
    createdAt!: Date;
}