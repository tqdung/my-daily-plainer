import { AuthProvider } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name?: string;

  @Expose()
  avatar?: string;

  @Expose()
  provider?: AuthProvider;

  @Expose()
  providerId?: string;
}
