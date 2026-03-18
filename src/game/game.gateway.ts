import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { Server, Socket } from 'socket.io';


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
  ) {}

  // 유저가 게임(소켓)에 접속했을 때 자동으로 실행되는 이벤트
  handleConnection(client: Socket) {
    console.log(`유저 접속됨: ${client.id}`);

    // 측정기의 숫자를 1 올린다 (+1)
    this.connectedPlayersGauge.inc();
  }

  // 유저가 게임을 종료하거나 연결이 끊겼을 때 실행.
  handleDisconnect(client: Socket) {
    console.log(`유저 접속 종료됨: ${client.id}`);

    // 측정기의 숫자를 1 내린다 (-1)
    this.connectedPlayersGauge.dec();
  }

  // 클라이언트가 'move'라는 이름표를 달고 데이터를 보내면 이 메서드가 받는다.
  @SubscribeMessage('move')
  handleMove(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.server.emit('playerMoved', {
      clientId: client.id,
      position: data,
    });
  }
}
