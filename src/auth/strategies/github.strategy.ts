import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from '../../user/user.entity';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private authService: AuthService,
    config: ConfigService,
  ) {
    super({
    clientID: config.get<string>('GITHUB_CLIENT_ID')!,
    clientSecret: config.get<string>('GITHUB_CLIENT_SECRET')!,
    callbackURL: config.get<string>('GITHUB_CALLBACK_URL')!,
    scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<User> {
    return this.authService.findOrCreateUser({
      githubId: String(profile.id),
      username: profile.username,
      email: profile.emails?.[0]?.value ?? undefined,
    });
  }
}