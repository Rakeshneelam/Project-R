import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:8081'],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('BondBridge API')
    .setDescription('Social Connection Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User profile and settings')
    .addTag('communities', 'Community management')
    .addTag('posts', 'Community posts and comments')
    .addTag('challenges', 'Daily and weekly challenges')
    .addTag('leaderboards', 'Leaderboard queries')
    .addTag('rewards', 'Badges and rewards')
    .addTag('friendship', 'Friend discovery and requests')
    .addTag('dating', 'Guided dating flow')
    .addTag('messages', 'Direct messaging')
    .addTag('notifications', 'User notifications')
    .addTag('moderation', 'Reports and moderation')
    .addTag('admin', 'Admin dashboard endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 BondBridge API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
