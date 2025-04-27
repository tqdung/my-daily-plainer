// src/common/utils/transform-response.ts
import { plainToInstance } from 'class-transformer';

export function transformResponse<T, V>(
  dto: new (...args: any[]) => T,
  data: V,
): T {
  return plainToInstance(dto, data, { excludeExtraneousValues: true });
}
