import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    // 비동기로 서비스 결과를 기다린 후 응답
    return await this.userService.findAll();
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto){
    return await this.userService.create(createUserDto);
  }

}