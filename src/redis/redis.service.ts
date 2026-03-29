import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { timestamp } from 'rxjs';

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
        // 유저 접속 종료 시 점수 데이터 삭제(캐시)
        await this.client.hDel('players:scores', clientId);
    }


    // 1. 새로운 아이템을 Redis에 저장. (key: itemID, value: 좌표)
    async setItem(itemId: string, position: {x: number, y: number}): Promise<void> {
        await this.client.hSet('items:coins', itemId, JSON.stringify(position));
    }

    // 2. 현재 맵에 있는 모든 아이템을 가져온다.
    async getAllItems(): Promise<Object> {
        const data = await this.client.hGetAll('items:coins');
        const items = {};
        for (const  [key, value] of Object.entries(data)) {
            items[key] = JSON.parse(value);
        }

        return items;
    }

    // 누군가 아이템을 먹었을 때 Redis에서 삭제
    async removeItem(itemId: string): Promise<boolean> {
        const result = await this.client.hDel('items:coins', itemId);
        
        // 삭제 성공 시 1, 이미 누가 먹어서 없으면 0
        return result === 1; 
    }

    // 현재 Redis에 저장된 코인의 총 개수를 조회
    async getItemCount():Promise<number> {
        const data = await this.client.hGetAll('items:conis');
        return Object.keys(data).length; // 해시 맵의 필드 개수 = 코인 개수
    }


    // 유저의 점수를 1점 올리고, 최종 점수를 반환 (HINCRBY 사용)
    async incrementPlayerScore(clientId: string): Promise<number> {
        // hIncrBy는 동시성 완벽 보장: 값이 없으면 0에서 시작해 1을 더함
        return await this.client.hIncrBy('players:scores', clientId, 1);
    }

    // 현재 접속 중인 모든 유저의 점수를 조회
    async getAllPlayerScores(): Promise<Record<string, number>> {
        const data = await this.client.hGetAll('players:scores');
        const scores: Record<string, number> = {};

        for (const [key, value] of Object.entries(data)){
            scores[key] = parseInt(value, 10); // 문자열을 숫자로 변경
        }
        
        return scores;
    }

    // 채팅 메시지를 Redis 리스트에 저장하고, 최근 50개만 유지
    async saveChatMessage(clientId: string, message: string): Promise<Object> {
        const chatData = JSON.stringify({
            clientId,
            message,
            timestamp: Date.now()
        });

        // chat:history 리스트의 맨 앞에 새로운 메시지를 밀어 넣는다.
        await this.client.lPush('chat:history', chatData);
        // 인덱스 0부터 49까지만 남기고 나머지는 메모리에서 삭제
        await this.client.lTrim('chat:history', 0, 49);

        return JSON.parse(chatData);
    }

    // 최근 50개의 채팅 내역 조회
    async getRecentChats(): Promise<any[]> {
        // 0~49까지의 데이터 조회
        const chats = await this.client.lRange('chat:history', 0, 49);

        // 저장될 때 최신이 0번이었으므로, 화면에 보여줄 때 역순으로 정렬
        return chats.map(c => JSON.parse(c)).reverse();
    }
 }
