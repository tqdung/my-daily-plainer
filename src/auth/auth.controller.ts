import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto, RegisterDto, LoginSocialDto } from './dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CurrentUser, RequireAuth } from 'src/common/decorators';
import { REFRESH_TOKEN_EXPIRED_IN_SECONDS } from './constants';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  setCookieRefreshToken(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh-token',
      maxAge: REFRESH_TOKEN_EXPIRED_IN_SECONDS * 1000,
      // domain: '.mydailyplaner.com' // Allow cookie to share between frontend / backend (mydailyplaner.com, api.mydailyplaner.com)
    });
  }

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  async login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.authService.login(payload);

    this.setCookieRefreshToken(res, refresh_token);

    return { access_token };
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

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res) {
    try {
      const refresh_token = req.cookies['refresh_token'];
      const payload = await this.authService.verifyRefreshToken(refresh_token);
      console.log(payload)

      const newAccessToken =
        await this.authService.generateAccessToken(payload.user);
      const newRefreshToken =
        await this.authService.generateRefreshToken(payload.user);

      this.setCookieRefreshToken(res, newRefreshToken);

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Get('my-profile')
  @RequireAuth()
  async getUserInfo(@CurrentUser() user: UserResponseDto) {
    return this.userService.findOne(user.id);
  }
}
