import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../user/user.entity';

@Controller('/api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Get('/github')
  @UseGuards(AuthGuard('github'))
  githubLogin(): void {}

  @Get('/github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.issueTokens(req.user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL')!;
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.redirect(frontendUrl);
  }


  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user: { userId: number; username: string } }) {
    return req.user;
  }
}