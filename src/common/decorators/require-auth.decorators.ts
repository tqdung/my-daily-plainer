import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

export function RequireAuth() {
  return applyDecorators(UseGuards(AuthGuard('jwt')), ApiBearerAuth());
}
