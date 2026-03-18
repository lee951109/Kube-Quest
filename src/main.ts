import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisAdapter } from '@socket.io/redis-adapter';
import { RedisIoAdapter } from './redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Redis 어댑터 인스턴스 생성
  const redisIoAdapter = new RedisIoAdapter(app);

  // 2. Redis 서버와 비동기 연결 수행
  await redisIoAdapter.connectToRedis();

  // 3. NestJS 앱에 어댑터 장착
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
