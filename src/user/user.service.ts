import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { GithubProfileDto } from '../auth/dto/github-profile.dto';

export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>, 
    ) {}

    async findByGithubId(githubId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { githubId }})
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async create(profile: GithubProfileDto): Promise<User> {
        const user = this.userRepository.create(profile);
        return this.userRepository.save(user);
    }
}