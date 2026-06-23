import { Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/jwt-user.type';
import type { ConfigType } from '@nestjs/config';
import { BusinessException } from '../common/exceptions/business.exception';
import { AuthError } from '../common/exceptions/error-code';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../user/user.entity';
import jwtConfig from '../config/jwt.config';

@Controller('/api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
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
      maxAge: this.jwtConf.refreshExpiresSeconds * 1000,
    });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.jwtConf.accessExpiresSeconds * 1000,
    });

    res.redirect(frontendUrl);
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = req.cookies['refreshToken'];
    if (!token) throw new BusinessException(AuthError.MISSING_REFRESH_TOKEN);

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(token);

    const isSecure = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: this.jwtConf.accessExpiresSeconds * 1000,
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: this.jwtConf.refreshExpiresSeconds * 1000,
    });
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = req.cookies['refreshToken'];
    if (token) await this.authService.logout(token, user.userId);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

}

