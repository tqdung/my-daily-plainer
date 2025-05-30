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
  async googleCallback(
    @Req() req: Request & { user: LoginSocialDto },
    @Res({ passthrough: true }) res,
  ) {
    const callbackUrl = req.originalUrl;
    const allowedCallbackURLs = ['/auth/google/callback']; // Whitelist domain
    const validCallbackUrl = allowedCallbackURLs.some((url) =>
      callbackUrl.startsWith(url),
    );

    if (!validCallbackUrl) {
      throw new UnauthorizedException('Invalid callback URL');
    }

    const { access_token, refresh_token } =
      await this.authService.loginWithSocialProvider(req.user);

    this.setCookieRefreshToken(res, refresh_token);

    return {
      access_token,
      refresh_token,
    };
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res) {
    try {
      const token = req.cookies['refresh_token'];
      if (!token) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      const payload = await this.authService.verifyRefreshToken(token);

      const { access_token, refresh_token } =
        await this.authService.generateTokens(payload.user);

      this.setCookieRefreshToken(res, refresh_token);

      return {
        access_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Get('clear-cookies')
  clearCookies(@Res() res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      // Nếu bạn đã dùng path riêng khi set, cần truyền path y chang
      path: '/auth/refresh-token',
    });

    res.send({ message: 'All cookies cleared' });
  }

  @Get('my-profile')
  @RequireAuth()
  async getUserInfo(@CurrentUser() user: UserResponseDto) {
    return this.userService.findOne(user.id);
  }
}
