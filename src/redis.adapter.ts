import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { ServerOptions } from "socket.io";

export class RedisIoAdapter extends IoAdapter {
    private adapterContstructor: ReturnType<typeof createAdapter>;

    // Redis 서버와 연결하는 초기화 작업
    async connectToRedis(): Promise<void> {
        const pubClinet = createClient({url: `redis://redis-cache:6379`});
        const subClient = pubClinet.duplicate();

        await Promise.all([pubClinet.connect(), subClient.connect()]);

        // Socket.io가 이 Redis 클라이언트들을 사용하도록 어댑터를 생성
        this.adapterContstructor = createAdapter(pubClinet, subClient);
    }

    // NestJS가 소켓 서버를 열 때 이 매서드를 가로채서 Redis 어댑터를 주입.
    createIOServer(port: number, options?: ServerOptions): any {
        // 1. 프레임워크가 하던 대로 기본 소켓 서버 생성
        const server = super.createIOServer(port, options);

        // 2. 서버가 만들어지자마자, Redis 어댑터를 강제로 장착
        server.adapter(this.adapterContstructor);

        // 3. Redis 어댑터를 장착한 서버를 프레임워크한테 리턴
        return server;
    }
}