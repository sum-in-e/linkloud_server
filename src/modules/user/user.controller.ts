import { Controller, Get, Post, Body, UsePipes, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KakaoSignUpDto, LoginDto, SignUpDto } from 'src/modules/user/dto/user.dto';
import { SignUpPipe } from 'src/modules/user/pipes/signup.pipe';
import { KakaoOauthService } from 'src/modules/user/oauth/kakao-oauth.service';
import { UserService } from 'src/modules/user/user.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { DisableSuccessInterceptor } from 'src/core/http/decorator/disable-success-interceptor.decorator';

@ApiTags('유저 APIs')
@Controller('user')
export class UserController {
  private readonly KAKAO_SIGNUP_REDIRECT_URI: string;
  private readonly KAKAO_LOGIN_REDIRECT_URI: string;

  constructor(
    private readonly userService: UserService,
    private readonly kakaoOauthService: KakaoOauthService,
    private readonly configService: ConfigService,
  ) {
    this.KAKAO_SIGNUP_REDIRECT_URI = this.configService.getOrThrow('KAKAO_SIGNUP_REDIRECT_URI');
    this.KAKAO_LOGIN_REDIRECT_URI = this.configService.getOrThrow('KAKAO_LOGIN_REDIRECT_URI');
  }

  @ApiOperation({ summary: '이메일 회원가입 ' })
  @Post('signup')
  @UsePipes(SignUpPipe)
  async createUser(@Body() body: SignUpDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.userService.createUser(body);

    // 로그인 처리를 위한 토큰 발급 및 쿠키에 토큰 저장
    await this.userService.setTokens(user.id, user.email, response);

    return {
      email: user.email,
      method: user.method,
    };
  }

  @ApiOperation({
    summary: '이메일 로그인',
  })
  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.userService.verifyUser(body);

    // 로그인 처리를 위한 토큰 발급 및 쿠키에 토큰 저장
    await this.userService.setTokens(user.id, user.email, response);

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
  async kakaoOauthSignupCallback(@Query('code') code: string) {
    const { email, sub } = await this.kakaoOauthService.getUserInfo(code, this.KAKAO_SIGNUP_REDIRECT_URI);

    return await this.userService.createKakaoVerificationInfo(email, sub); // 회원 가입 완료를 위해서는 클라이언트로부터 닉네임 입력과 약관 동의를 받아야하므로 회원가입 완료 API를 분리함
  }

  @ApiOperation({
    summary: '카카오 회원가입 - 가입 완료 API (닉네임, 약관 동의 받아서 최종 가입)',
    description:
      '회원가입 완료를 위해 유저에게 추가적으로 닉네임 입력과 약관 동의를 받아 호출하는 API로 kakaoVerificationInfo에 저장된 유저 정보와 대조하여 인증을 확인한 후, 회원가입 완료 후 쿠키에 엑세스토큰과 리프레시토큰을 저장합니다.',
  })
  @Post('signup/kakao')
  async createUserByKakao(@Body() body: KakaoSignUpDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.userService.createUserByKakao(body);

    // 로그인 처리를 위한 토큰 발급 및 쿠키에 토큰 저장
    await this.userService.setTokens(user.id, user.email, response);

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
  async kakaoOauthLoginCallback(@Query('code') code: string, @Res({ passthrough: true }) response: Response) {
    const { email, sub } = await this.kakaoOauthService.getUserInfo(code, this.KAKAO_LOGIN_REDIRECT_URI);

    const user = await this.userService.verifyKakaoUser(email);

    // 로그인 처리를 위한 토큰 발급 및 쿠키에 토큰 저장
    await this.userService.setTokens(user.id, user.email, response);

    // 클라이언트로 리다이렉트
    // TODO: 회원가입 완료 페이지로 유저 리다이렉트 시키기
    // TODO: 클라이언트는 아래 페이지 리다이렉트 시 유저 정보를 조회하는 요청을 보내고 성공 응답 받으면
    // TODO: 유저 정보를 로컬스토리지 등에 저장하고 로그인된 상태의 UI를 보여준다.
    response.redirect(`https://linkloud.co.kr?email=${user.email}&method=${user.method}`);
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('act', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax' });
    response.cookie('rft', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax' });
    return {};
  }

  // TODO: 로그인한 유저 정보 조회 - acc 토큰 기반으로 현재 로그인 유저 인식
  // TODO: 유저 정보 수정
  // TODO: 회원 탈퇴
}
