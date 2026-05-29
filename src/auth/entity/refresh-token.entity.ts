// src/auth/entities/refresh-token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  token!: string;

  @Column()
  expiresAt!: Date;

  @Column({ default: false })
  isRevoked!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}