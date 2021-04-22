import { NestFactory } from '@nestjs/core';
import { AppGsuiteModule } from './app.gsuite.module';

async function bootstrap() {
  const app = await NestFactory.create(AppGsuiteModule);
  await app.listen(3000);
}
bootstrap();
