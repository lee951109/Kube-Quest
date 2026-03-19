import { ConnectedSocket, MessageBody,
   OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';


@WebSocketGateway({cors: true})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // 현재 연결된 웹소켓 서버 객체(인스턴스) 조회
  // 이를통해 접속한 '모든' 유저에게 브로드캐스팅할 수 있다.
  @WebSocketServer()
  server: Server;

  // DI: 모듈에 등록한 커스텀 게이지를 조회
  constructor(
    @InjectMetric('kube_quest_connected_players')
    private readonly connectedPlayersGauge: Gauge<string>,
    private readonly redisService: RedisService,
  ) {}

  // 유저가 게임(소켓)에 접속했을 때 자동으로 실행되는 이벤트
  async handleConnection(client: Socket): Promise<void> {
    console.log(`유저 접속됨: ${client.id}`);

    // 측정기의 숫자를 1 올린다 (+1)
    this.connectedPlayersGauge.inc();
    
    // 새로 접속한 유저에게 기존에 있던 모든 유저의 위치를 공유
    const allPositions = await this.redisService.getAllPlayerPositions();
    client.emit('initPositions', allPositions);
  }

  // 유저가 게임을 종료하거나 연결이 끊겼을 때 실행.
  async handleDisconnect(client: Socket): Promise<void> {
    console.log(`유저 접속 종료됨: ${client.id}`);
    // 측정기의 숫자를 1 내린다 (-1)
    this.connectedPlayersGauge.dec();

    // 접속을 끊으면 Redis에서 해당 유저의 좌표를 제거
    await this.redisService.removePlayer(client.id);
    // 다른 유저들에게 이 유저가 나갔다고 공지
    this.server.emit('playerDisconnected', client.id);
  }

  // 클라이언트가 'move'라는 이름표를 달고 데이터를 보내면 이 메서드가 받는다.
  @SubscribeMessage('move')
  async handleMove(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // 이동할 때마다 Redis 메모리에 0.001초 만에 좌표를 덮어씁니다.
    await this.redisService.setPlayerPosition(client.id, data)

    this.server.emit('playerMoved', {
      clientId: client.id,
      position: data,
    });
  }
}
