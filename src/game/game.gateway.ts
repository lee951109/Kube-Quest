import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({cors: true})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // 현재 연결된 웹소켓 서버 객체(인스턴스) 조회
  // 이를통해 접속한 '모든' 유저에게 브로드캐스팅할 수 있다.
  @WebSocketServer()
  server: Server;

  // 유저가 게임(소켓)에 접속했을 때 자동으로 실행되는 이벤트
  handleConnection(client: Socket) {
    console.log(`유저 접속됨: ${client.id}`);
  }

  // 유저가 게임을 종료하거나 연결이 끊겼을 때 실행.
  handleDisconnect(client: Socket) {
    console.log(`유저 접속 종료됨: ${client.id}`);
  }

  // 클라이언트가 'move'라는 이름표를 달고 데이터를 보내면 이 메서드가 받는다.
  @SubscribeMessage('move')
  handleMove(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(`유저 ${client.id} 이동:`, data);

    // 자신을 포함한 '모든' 접속자에게 현재 유저의 이동 정보를 다시 뿌린다.
    this.server.emit('playerMoved', {
      clientId: client.id,
      position: data,
    });
  }
}
