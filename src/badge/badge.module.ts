import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBadge } from './entities/user-badge.entity';
import { BadgeService } from './badge.service';
import { BadgeRepository } from './badge.repository';

@Module({
    imports: [TypeOrmModule.forFeature([UserBadge])],
    providers: [BadgeService, BadgeRepository],
    exports: [BadgeService],
})
export class BadgeModule {}
