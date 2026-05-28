import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { User } from '../user/user.entity';

@Controller('/api/auth')
export class AuthController {
  @Get('/github')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {}

  @Get('/github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): void {
    //TODO : 로그인 성공 후 프론트엔드로 리다이렉트하거나 JWT 토큰을 발급하는 로직 구현 예정
    res.json(req.user);
  }
}