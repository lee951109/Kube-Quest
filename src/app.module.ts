// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { GameModule } from './game/game.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres-db', // docker-compose의 서비스 이름
      port: 5432,
      username: 'quest_admin',     // docker-compose.yml에 적은 계정 정보
      password: 'quest_password',
      database: 'kube_quest_db',
      entities: [User], // 엔티티 등록
      synchronize: true, // Entity 변경 시 DB 스키마를 자동 업데이트 (개발 환경에서만 true!)
    }),
    UserModule,
    GameModule,
    RedisModule,
  ],
})
export class AppModule {}