import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { LoginDto, LoginSocialDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { transformResponse } from 'src/common/utils';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRED_IN_SECONDS,
  REFRESH_TOKEN_EXPIRED_IN_SECONDS,
} from './constants';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  transformUser(user: User) {
    return transformResponse(UserResponseDto, user);
  }

  async generateAccessToken(user: UserResponseDto): Promise<string> {
    return this.jwtService.signAsync(
      { user },
      {
        secret: ACCESS_TOKEN_SECRET,
        expiresIn: ACCESS_TOKEN_EXPIRED_IN_SECONDS,
      },
    );
  }

  async generateRefreshToken(user: UserResponseDto): Promise<string> {
    return this.jwtService.signAsync(
      { user },
      {
        secret: REFRESH_TOKEN_SECRET,
        expiresIn: REFRESH_TOKEN_EXPIRED_IN_SECONDS,
      },
    );
  }

  async generateTokens(user: UserResponseDto) {
    const access_token = await this.generateAccessToken(user);
    const refresh_token = await this.generateRefreshToken(user);

    return {
      access_token,
      refresh_token,
    };
  }

  async verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token, { secret: ACCESS_TOKEN_SECRET });
  }

  async verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync(token, { secret: REFRESH_TOKEN_SECRET });
  }

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userService.create({
      ...data,
      password: hashedPassword,
      provider: 'CREDENTIALS',
    });
    return this.generateTokens(this.transformUser(user));
  }

  async login(data: LoginDto) {
    const user = await this.userService.findByEmail(data.email);
    if (!user || !user.password) throw new NotFoundException();

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(this.transformUser(user));
  }

  async loginWithSocialProvider(data: LoginSocialDto) {
    let user = await this.userService.findBySocialProvider(
      data.provider,
      data.providerId,
    );

    if (!user) {
      user = await this.userService.create(data);
    }

    return this.generateTokens(this.transformUser(user));
  }
}
