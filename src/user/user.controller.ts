import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {

    // 생성자 주입
    constructor(private readonly userService: UserService) {}

    @Get()
    getAllUsers() {
        return this.userService.findAll();
    }

    @Post()
    createUser(@Body() createUserDto: CreateUserDto){
        return this.userService.create(createUserDto);
    }
}
