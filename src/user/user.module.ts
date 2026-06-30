import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { SnippetResultModule } from '../snippet-result/snippet-result.module';
import { BadgeModule } from '../badge/badge.module';
import { R2StorageService } from '../common/storage/r2.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SnippetResultModule, BadgeModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, R2StorageService],
  exports: [UserService, UserRepository],
})
export class UserModule {}
