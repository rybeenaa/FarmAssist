import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Flare } from '@flareapp/js';

async function bootstrap() {
  if (process.env.NODE_ENV !== 'development') {
    Flare.init({
      key: process.env.FLARE_KEY!,
      environment: process.env.NODE_ENV,
    });
  }
  const app = await NestFactory.create(AppModule);

  // GLOBAL VALIDATION
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ENABLE CORS
  app.enableCors({
    origin: 'http:localhost:3000',
    credentials: true,
  });

  // GLOBAL SERIALIZATION INTERCEPTOR
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 4000);

  console.log(`Server is running on port: 4000`);
}
bootstrap();
