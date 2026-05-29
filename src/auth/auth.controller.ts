import { Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
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
      maxAge: 5 * 60 * 1000,
    });

    res.redirect(frontendUrl);
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = req.cookies['refreshToken'];
    if (!token) throw new UnauthorizedException('refresh token 없음');

    const accessToken = await this.authService.refresh(token);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = req.cookies['refreshToken'];
    if (token) await this.authService.logout(token);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user: { userId: number; username: string } }) {
    return req.user;
  }
}
