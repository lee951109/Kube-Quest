import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;

    constructor() {
        // Redis 클라이언트 초기화 (기본 포트 6379)
        this.client = createClient({url: 'redis://redis-cache:6379'});
    }

    // 모듈이 초기화될 때 Redis와 연결.
    async onModuleInit(): Promise<void> {
        await this.client.connect();

        console.log('Redis Cache Service 연결 완료');
    }

    // 서버가 꺼질 때 안전하게 연결 종료.
    async onModuleDestroy(): Promise<void> {
        await this.client.disconnect();
    }

    // 1. 유저의 좌표를 Redis Hash(HSET) 구조로 저장
    async setPlayerPosition(clientId: string, position: any): Promise<void> {
        // 'players:positions'라는 하나의 바구니(Key) 안에, 유저 ID(Field)와 좌표(Value)를 추가
        await this.client.hSet('players:positions', clientId, JSON.stringify(position));
    }

    // 2. 현재 접속 중인 모든 유저의 좌표를 한 번에 가져온다.
    async getAllPlayerPositions(): Promise<any> {
        const data = await this.client.hGetAll('players:positions');
        const positions = {};

        for(const [key, value] of Object.entries(data)) {
            positions[key] = JSON.parse(value);
        }

        return positions;
    }

    // 3. 접속을 종료한 유저의 데이터를 캐시에서 제거
    async removePlayer(clientId: string): Promise<void> {
        await this.client.hDel('players:positions', clientId);
    }

}
