import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash mật khẩu cho user 1
  const hashedPassword1 = await bcrypt.hash('password', 10); // Mật khẩu cho user1

  await prisma.user.createMany({
    data: [
      {
        email: 'user@example.com',
        name: 'User One',
        password: hashedPassword1,
        provider: 'CREDENTIALS',
      },
      {
        email: 'google_user@example.com',
        name: 'Google User',
        provider: 'GOOGLE',
        providerId: 'google-uid-123',
      },
      {
        email: 'facebook_user@example.com',
        name: 'Facebook User',
        provider: 'FACEBOOK',
        providerId: 'fb-uid-456',
      },
    ],
    skipDuplicates: true, // tránh lỗi khi seed nhiều lần
  });
}

main()
  .then(() => {
    console.log('🌱 Seed completed.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
