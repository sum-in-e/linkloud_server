import { QueryRunner } from 'typeorm';
import { Controller, Get, Post, Body, UsePipes, Query, Res, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { KakaoSignUpDto, LoginDto, SignUpDto } from 'src/modules/user/dto/user.dto';
import { SignUpPipe } from 'src/modules/user/pipes/signup.pipe';
import { KakaoOauthService } from 'src/modules/user/oauth/kakao-oauth.service';
import { UserService } from 'src/modules/user/user.service';
import { DisableSuccessInterceptor } from 'src/core/http/decorator/disable-success-interceptor.decorator';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';
import { AuthService } from 'src/core/auth/auth.service';
import { TransactionInterceptor } from 'src/core/interceptors/transaction.interceptor';
import { TransactionManager } from 'src/core/decorators/transaction.decorator';
import { CloudService } from 'src/modules/cloud/cloud.service';

@ApiTags('유저 APIs')
@Controller('user')
export class UserController {
  private readonly KAKAO_SIGNUP_REDIRECT_URI: string;
  private readonly KAKAO_LOGIN_REDIRECT_URI: string;

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly cloudService: CloudService,
    private readonly kakaoOauthService: KakaoOauthService,
    private readonly configService: ConfigService,
  ) {
    this.KAKAO_SIGNUP_REDIRECT_URI = this.configService.getOrThrow('KAKAO_SIGNUP_REDIRECT_URI');
    this.KAKAO_LOGIN_REDIRECT_URI = this.configService.getOrThrow('KAKAO_LOGIN_REDIRECT_URI');
  }

  @ApiOperation({ summary: '이메일 회원가입 ' })
  @Post('signup')
  @UsePipes(SignUpPipe)
  @UseInterceptors(TransactionInterceptor)
  @IsPublic()
  async createUser(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = await this.userService.createUser(body, queryRunner);
    // TODO: 가이드용 링크 아이템 생성

    await this.authService.generateTokens(user.id, user.email, response);

    return {
      email: user.email,
      method: user.method,
    };
  }
  @ApiOperation({
    summary: '이메일 로그인',
  })
  @Post('login')
  @IsPublic()
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.userService.verifyUser(body);

    await this.authService.generateTokens(user.id, user.email, response);

    return {
      email: user.email,
      method: user.method,
    };
  }

  @ApiOperation({
    summary: '카카오 회원가입 - 회원 정보 가져오기 (카카오 로그인 API 리다이렉트 URI)',
    description: '카카오 서버로부터 유저 정보를 받아와 kakaoVerificationInfo에 저장합니다.',
  })
  @Get('signup/oauth-kakao')
  @IsPublic()
  async kakaoOauthSignupCallback(@Query('code') code: string, @Res({ passthrough: true }) response: Response) {
    const { email, sub } = await this.kakaoOauthService.getUserInfo(code, this.KAKAO_SIGNUP_REDIRECT_URI);

    await this.userService.createKakaoVerificationInfo(email, sub); // 회원 가입 완료를 위해서는 클라이언트로부터 닉네임 입력과 약관 동의를 받아야하므로 회원가입 완료 API를 분리함

    // 닉네임, 약관 동의받는 페이지로 유저 리다이렉트
    response.redirect(`https://linkloud.co.kr/signup/oauth?sign=${sub}`);
  }

  @ApiOperation({
    summary: '카카오 회원가입 - 가입 완료 API (닉네임, 약관 동의 받아서 최종 가입)',
    description:
      '회원가입 완료를 위해 유저에게 추가적으로 닉네임 입력과 약관 동의를 받아 호출하는 API로 kakaoVerificationInfo에 저장된 유저 정보와 대조하여 인증을 확인한 후, 회원가입 완료 후 쿠키에 엑세스토큰과 리프레시토큰을 저장합니다.',
  })
  @Post('signup/kakao')
  @UseInterceptors(TransactionInterceptor)
  @IsPublic()
  async createUserByKakao(
    @Body() body: KakaoSignUpDto,
    @Res({ passthrough: true }) response: Response,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = await this.userService.createUserByKakao(body, queryRunner);
    // TODO: 가이드용 링크 아이템 생성
    await this.authService.generateTokens(user.id, user.email, response);

    return {
      email: user.email,
      method: user.method,
    };
  }

  @ApiOperation({
    summary: '카카오 로그인 - 회원 정보 가져오기 및 로그인 (카카오 로그인 API 리다이렉트 URI)',
    description:
      '카카오 서버로부터 유저 정보를 받아 인증하고 쿠키에 엑세스토큰과 리프레시토큰을 저장합니다. 카카오 회원가입과 달리 하나의 API로 로그인까지 완료됩니다.',
  })
  @Get('login/oauth-kakao')
  @DisableSuccessInterceptor()
  @IsPublic()
  async kakaoOauthLoginCallback(@Query('code') code: string, @Res({ passthrough: true }) response: Response) {
    const { email } = await this.kakaoOauthService.getUserInfo(code, this.KAKAO_LOGIN_REDIRECT_URI);

    const user = await this.userService.verifyKakaoUser(email);

    await this.authService.generateTokens(user.id, user.email, response);

    response.redirect(`https://linkloud.co.kr`); // 로그인 되면 linkloud.co.kr이 마이 클라우드 페이지가 될 것이니 여기로 보내면 됌
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  @IsPublic()
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('act', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax' });
    response.cookie('rft', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax' });
    return {};
  }

  // TODO: 로그인한 유저 정보 조회 - acc 토큰 기반으로 현재 로그인 유저 인식
  // TODO: 유저 정보 수정
  // TODO: 회원 탈퇴
}
