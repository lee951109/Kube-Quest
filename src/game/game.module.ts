import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [
    GameGateway,
    makeGaugeProvider({
      name: 'kube_quest_connected_players', // 프로메테우스에 표시될 변수명
      help: '현재 Kube-Quest에 접속 중인 실시간 플레이어 수'  // 설명
    }),
  ],
})
export class GameModule {}
