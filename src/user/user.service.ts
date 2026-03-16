import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    // DB를 연결하기 전까지 사용할 임시 메모리 저장소
    private users: any[] = [];

    // 모든 유저 목록 조회
    findAll() {
        return this.users;
    }

    /**
     * 새로운 유저 생성
     * @param createUserDto  클라이언트로부터 전달받은 유저 정보 DTO
     */
    create(createUserDto: CreateUserDto) {
        // 새 유저 객체 생성 (고유 ID용 임시 로직 포함)
        const newUser = {
            id: this.users.length + 1,  // Auto-increment
            ...createUserDto,           // DTO의 속성들을 insert
            createdAt: new Date(),      // 생성 시간 
        };

        // DB 저장
        this.users.push(newUser);

        return newUser;
    }
}
