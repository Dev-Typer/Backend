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

    @Column({ default: 0 })
    tier!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role!: UserRole;

    @CreateDateColumn()
    createdAt!: Date;
}
