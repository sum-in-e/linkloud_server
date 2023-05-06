import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KakaoSignUpDto, SignUpDto } from 'src/modules/user/dto/user.dto';
import { SignUpPipe } from 'src/modules/user/pipes/signup.pipe';
import { UserService } from 'src/modules/user/user.service';
@ApiTags('유저 APIs')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '이메일 회원가입' })
  @Post('signup')
  @UsePipes(SignUpPipe)
  async createUser(@Body() body: SignUpDto) {
    return await this.userService.createUser(body);
  }

  @ApiOperation({ summary: '카카오 회원가입' })
  @Post('signup/kakao')
  @UsePipes(SignUpPipe)
  async createUserByKakao(@Body() body: KakaoSignUpDto) {
    return await this.userService.createUserByKakao(body);
  }

  // TODO: 로그인
  // TODO: 로그인 - 카카오
  // TODO: 로그인한 유저 정보 조회 - acc 토큰 기반으로 현재 로그인 유저 인식
  // TODO: 로그아웃
  // TODO: 유저 정보 수정
  // TODO: 회원 탈퇴
}
