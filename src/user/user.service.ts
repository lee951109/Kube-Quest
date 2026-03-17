import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    // 생성자를 통해 TypeORM의 Repository<User>를 주입 받는다.
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /**
     * 모든 Kube-Quest 유저 목록을 DB에서 조회
     * 네트워크 통신(DB 접근)이 발생하므로 비동기(Promise/async-await)로 처리해야함
     */
    async findAll(): Promise<User[]> {
        // 내부적으로 'SELECT * FROM users' 쿼리 실행
        return await this.userRepository.find();
    }

    /**
     * 새로운 게임 유저를 DB에 생성
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        // 1. DTO 데이터를 기반으로 새로운 User 엔티티 '인스턴스'를 메모리상에 생성 (아직 DB 저장 x)
        const newUser = this.userRepository.create(createUserDto);

        // 2. 만들어진 인스턴스를 실제 데이터베이스에 저장
        return await this.userRepository.save(newUser);
    }
}
