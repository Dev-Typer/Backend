import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { UserRole } from './enums/user-role.enum';

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

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role!: UserRole;

    @Column({ nullable: true, type: 'varchar' })
    profileUrl!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    bannerUrl!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}
