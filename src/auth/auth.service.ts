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

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userService.create({
      ...data,
      password: hashedPassword,
      provider: 'CREDENTIALS',
    });
    return this.generateToken(user);
  }

  async login(data: LoginDto) {
    const user = await this.userService.findByEmail(data.email);
    if (!user || !user.password) throw new NotFoundException();

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user);
  }

  async loginWithSocialProvider(data: LoginSocialDto) {
    let user = await this.userService.findBySocialProvider(
      data.provider,
      data.providerId,
    );

    if (!user) {
      user = await this.userService.create(data);
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const token = this.jwtService.sign({
      user: transformResponse(UserResponseDto, user),
    });
    return { access_token: token };
  }
}
