import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn'],
  });
  const logger = new Logger('Bootstrap');
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Optional, removes extra properties
      forbidNonWhitelisted: true, // Optional, throws error if extra properties are present
    }),
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Task API')
    .setDescription('The task management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ Log uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });

  // ✅ Log unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
