import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { LoginSocialDto } from '../dto/login.dto';

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, emails, photos, username } = profile;

    const user: LoginSocialDto = {
      email: emails?.[0].value ?? '',
      name: username ?? '',
      avatar: photos?.[0]?.value,
      providerId: id,
      provider: 'GOOGLE',
    };

    return user;
  }
}
