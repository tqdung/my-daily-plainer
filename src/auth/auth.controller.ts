import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, LoginSocialDto } from './dto/login.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Passport will automatically redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request & { user: LoginSocialDto }) {
    const callbackUrl = req.originalUrl;
    const allowedCallbackURLs = ['/auth/google/callback']; // Whitelist domain
    const validCallbackUrl = allowedCallbackURLs.some((url) =>
      callbackUrl.startsWith(url),
    );
    if (!validCallbackUrl) {
      throw new UnauthorizedException('Invalid callback URL');
    }

    return this.authService.loginWithSocialProvider(req.user);
  }
}
