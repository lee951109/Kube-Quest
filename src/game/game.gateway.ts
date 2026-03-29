import { ConnectedSocket, MessageBody,
   OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';


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

  // 서버가 켜질 때, 5초마다 랜덤 위치에 코인을 생성
  afterInit() {
    setInterval(async() => {
      // 현재 코인 개수를 확인
      const currentCoinCount = await this.redisService.getItemCount();
      
      // 필드에 코인이 너무 많으면(예: 30개 이상) 생성을 건너뜀
      if (currentCoinCount >= 30) {
        // console.log('필드에 코인이 너무 많습니다. 생성을 건너뜁니다.');
        return;
      }

      const itemId = `coin_${uuidv4()}`;
      // 600x400 랜덤 좌표
      const position = { x: Math.floor(Math.random() * 580) + 10, y: Math.floor(Math.random() * 380) + 10};
      
      await this.redisService.setItem(itemId, position);

      // 생성된 코인 정보를 모든 클라이언트에게 전파
      this.server.emit('itemSpawned', { itemId, position });
    }, 20000);
  }

  // 유저가 게임(소켓)에 접속했을 때 자동으로 실행되는 이벤트
  async handleConnection(client: Socket): Promise<void> {
    console.log(`유저 접속됨: ${client.id}`);

    // 측정기의 숫자를 1 올린다 (+1)
    this.connectedPlayersGauge.inc();
    
    // 새로 접속한 유저에게 기존에 있던 모든 유저의 위치를 공유
    const allPositions = await this.redisService.getAllPlayerPositions();
    const allItems = await this.redisService.getAllItems();
    // 접속 시 기존 유저들의 점수 조회
    const allScores = await this.redisService.getAllPlayerScores();
    // 접속 시 최근 채팅 내역 50개를 불러와서 전송
    const recentChats = await this.redisService.getRecentChats();

    client.emit('initPositions', allPositions);
    client.emit('initItems', allItems);
    client.emit('initScores', allScores);
    client.emit('initChat', recentChats);
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

    this.server.emit('playerMoved', { clientId: client.id, position: data });
  }

  // 클라이언트가 코인을 획득했을 때 처리
  @SubscribeMessage('collectItem')
  async handleCollectItem(@MessageBody() data: {itemId: string}, @ConnectedSocket() client: Socket) {
    // Redis에서 삭제 (누가 먼저 지웠으면 false가 반환)
    const isCollected = await this.redisService.removeItem(data.itemId);

    if (isCollected) {
      console.log(`[백엔드] 코인 획득 검증 완료. 점수를 올립니다.`);
      
      // 1. Redis에서 점수 1 증가 (새로운 점수 반환)
      const newScore = await this.redisService.incrementPlayerScore(client.id);

      // 2. 코인이 사라졌음을 알림
      this.server.emit('itemCollected', { itemId: data.itemId, clientId: client.id });
      
      // 3. 해당 유저의 점수가 올랐음을 모두에게 알림
      this.server.emit('scoreUpdated', { clientId: client.id, score: newScore });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: Socket) {
    if (!data.message || data.message.trim() === '') return;

    // 1. Redis에 메시지 저장 (최대 50개 유지)
    const savedChat = await this.redisService.saveChatMessage(client.id, data.message);
    
    // 2. 모든 접속자에게 새로운 채팅 메시지를 브로드캐스팅
    this.server.emit('chatMessage', savedChat);
  }
}
