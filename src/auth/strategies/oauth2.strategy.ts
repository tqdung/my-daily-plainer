import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { LoginSocialDto } from '../dto/login-social.dto';

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, emails, photos, username } = profile;

    const user: LoginSocialDto = {
      email: emails?.[0].value ?? '',
      name: username ?? '',
      avatar: photos?.[0]?.value,
      providerId: id,
      accessToken,
      refreshToken,
      provider: 'GOOGLE',
      calendarProvider: 'GOOGLE',
    };

    return user;
  }

  authorizationParams(options: any): Record<string, string> {
    return {
      access_type: 'offline', // ask permission to renew refresh_token
      prompt: 'consent', // force Google show popup renew refresh_token
    };
  }
}
