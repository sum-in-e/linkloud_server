import { QueryRunner } from 'typeorm';
import { Controller, Get, Post, Body, UsePipes, Query, Res, UseInterceptors, Req, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response, CookieOptions } from 'express';
import { KakaoCodeDto, KakaoSignUpDto, LoginDto, SignUpDto } from 'src/modules/user/dto/user.dto';
import { SignUpPipe } from 'src/modules/user/pipes/signup.pipe';
import { KakaoOauthService } from 'src/modules/user/oauth/kakao-oauth.service';
import { UserService } from 'src/modules/user/user.service';
import { DisableSuccessInterceptor } from 'src/core/http/decorator/disable-success-interceptor.decorator';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';
import { AuthService } from 'src/core/auth/auth.service';
import { TransactionInterceptor } from 'src/core/tansaction/interceptors/transaction.interceptor';
import { TransactionManager } from 'src/core/tansaction/decorators/transaction.decorator';
import { LinkService } from 'src/modules/link/link.service';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import * as querystring from 'querystring';

@ApiTags('유저 APIs')
@Controller('user')
export class UserController {
  private readonly KAKAO_REST_API_KEY: string;
  private readonly KAKAO_SIGNUP_REDIRECT_URI: string;
  private readonly KAKAO_LOGIN_REDIRECT_URI: string;
  private readonly CLIENT_URL: string;
  private readonly HOST: string;
  private readonly MODE: string;

  constructor(
    private readonly userService: UserService,
    private readonly linkService: LinkService,
    private readonly authService: AuthService,
    private readonly kakaoOauthService: KakaoOauthService,
    private readonly configService: ConfigService,
  ) {
    this.KAKAO_REST_API_KEY = this.configService.getOrThrow('KAKAO_REST_API_KEY');
    this.KAKAO_SIGNUP_REDIRECT_URI = this.configService.getOrThrow('KAKAO_SIGNUP_REDIRECT_URI');
    this.KAKAO_LOGIN_REDIRECT_URI = this.configService.getOrThrow('KAKAO_LOGIN_REDIRECT_URI');
    this.CLIENT_URL = this.configService.getOrThrow('CLIENT_URL');
    this.HOST = this.configService.getOrThrow('HOST');
    this.MODE = this.configService.getOrThrow('MODE');
  }

  @ApiOperation({ summary: '로그인한 유저 조회' })
  @Get('me')
  async getMe(@Req() request: RequestWithUser) {
    const user = request.user;

    return {
      id: user.id,
      email: user.email,
      method: user.method,
      name: user.name,
    };
  }

  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiResponse({ status: 400, description: `${ResponseCode.NOT_VERIFIED_EMAIL} , ${ResponseCode.EMAIL_ALREADY_EXIST}` })
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

    await this.userService.updateLastLoginAt(user, queryRunner);
    await this.linkService.createGuideLinks(user, queryRunner); // 가이드용 링크 아이템 생성
    await this.authService.generateTokens(user.id, user.email, response); // 토큰 생성
    await this.setClientInCookie(response); // 로그인 식별할 수 있는 client_in 쿠키 심기

    return {
      email: user.email,
      method: user.method,
    };
  }

  @ApiOperation({
    summary: '이메일 로그인',
  })
  @ApiResponse({
    status: 400,
    description: `${ResponseCode.SIGNED_BY_KAKAO}, ${ResponseCode.DELETED_USER}, ${ResponseCode.WRONG_PASSWORD}`,
  })
  @ApiResponse({ status: 404, description: ResponseCode.EMAIL_NOT_EXIST })
  @Post('login')
  @IsPublic()
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.userService.verifyUser(body);

    await this.userService.updateLastLoginAt(user);
    await this.authService.generateTokens(user.id, user.email, response);
    await this.setClientInCookie(response);

    return {
      email: user.email,
      method: user.method,
    };
  }

  @ApiOperation({
    summary: '카카오 - 카카오 인증 코드 가져오기',
    description:
      '카카오 서버로부터 카카오 인증 코드를 받아오기 위한 302응답을 반환합니다. 클라이언트에서도 비동기 요청이 아닌 href로 이 엔드포인트에 요청을 보내야합니다.',
  })
  @ApiResponse({
    status: 302,
    description: `인가 코드를 요청하기 위한 카카오 서버 도메인으로 리다이렉트`,
  })
  @ApiQuery({
    name: 'type',
    description: `login | signup - 카카오 로그인, 회원가입 시 동일한 API를 호출하되 타입을 전달해 주세요`,
  })
  @Get('auth/kakao')
  @DisableSuccessInterceptor()
  @IsPublic()
  async authKakao(@Query('type') type: 'login' | 'signup', @Res({ passthrough: true }) response: Response) {
    let query;

    const commonQuery = { client_id: this.KAKAO_REST_API_KEY, response_type: 'code' };

    if (type === 'signup') {
      // 💡각 property를 URL 쿼리 문자열로 인코딩한다. 이렇게하면 주소창에는 인코딩된 쿼리 문자열이 보이지만, 실제로는 원래의 값으로 요청이 전달된다.
      query = querystring.stringify({
        ...commonQuery,
        redirect_uri: this.KAKAO_SIGNUP_REDIRECT_URI,
      });
    }
    if (type === 'login') {
      query = querystring.stringify({
        ...commonQuery,
        redirect_uri: this.KAKAO_LOGIN_REDIRECT_URI,
      });
    }

    return response.redirect(`https://kauth.kakao.com/oauth/authorize?${query}`);
  }

  @ApiOperation({
    summary: '카카오 회원가입 - 회원 정보 가져오기 (카카오 로그인 API 리다이렉트 URI)',
    description: '카카오 서버로부터 유저 정보를 받아와 kakaoVerificationInfo에 저장합니다.',
  })
  @ApiResponse({ status: 400, description: ResponseCode.EMAIL_ALREADY_EXIST })
  @Get('signup/oauth-kakao')
  @DisableSuccessInterceptor()
  @IsPublic()
  async kakaoOauthSignupCallback(@Query() query: KakaoCodeDto, @Res({ passthrough: true }) response: Response) {
    const kakaoUserInfo = await this.kakaoOauthService.getUserInfo(query.code, this.KAKAO_SIGNUP_REDIRECT_URI);

    if (kakaoUserInfo === null) {
      console.log('kakaoUserInfo is null');

      // 카카오 유저 정보를 에러로 못 가져온 경우 이전 회원가입 페이지로 이동
      return response.redirect(`${this.CLIENT_URL}/signup?error=카카오계정 연동에 실패하였습니다.`);
    }
    console.log('1차', kakaoUserInfo);
    const user = await this.userService.createKakaoVerificationInfo(kakaoUserInfo.email, kakaoUserInfo.sub); // 회원 가입 완료를 위해서는 클라이언트로부터 닉네임 입력과 약관 동의를 받아야하므로 회원가입 완료 API를 분리함
    console.log('2차', user);

    if ('error' in user) {
      console.log('error in user');
      return response.redirect(`${this.CLIENT_URL}/signup?error=${user.error}`);
    }

    // 닉네임, 약관 동의받는 페이지로 유저 리다이렉트
    return response.redirect(`${this.CLIENT_URL}/signup/oauth?sign=${kakaoUserInfo.sub}`);
  }

  @ApiOperation({
    summary: '카카오 회원가입 - 가입 완료 API (닉네임, 약관 동의 받아서 최종 가입)',
    description:
      '회원가입 완료를 위해 유저에게 추가적으로 닉네임 입력과 약관 동의를 받아 호출하는 API로 kakaoVerificationInfo에 저장된 유저 정보와 대조하여 인증을 확인한 후, 회원가입 완료 후 쿠키에 엑세스토큰과 리프레시토큰을 저장합니다.',
  })
  @ApiResponse({
    status: 400,
    description: `${ResponseCode.EMAIL_ALREADY_EXIST}, ${ResponseCode.INVALID_USER_NAME_FORMAT}, ${ResponseCode.DELETED_USER}`,
  })
  @ApiResponse({ status: 404, description: ResponseCode.KAKAO_VERIFICATION_INFO_NOT_EXIST })
  @Post('signup/kakao')
  @UseInterceptors(TransactionInterceptor)
  @IsPublic()
  async createUserByKakao(
    @Body() body: KakaoSignUpDto,
    @Res({ passthrough: true }) response: Response,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = await this.userService.createUserByKakao(body, queryRunner);

    await this.userService.updateLastLoginAt(user, queryRunner);
    await this.linkService.createGuideLinks(user, queryRunner);
    await this.authService.generateTokens(user.id, user.email, response);
    await this.setClientInCookie(response);

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
  @ApiResponse({
    status: 400,
    description: `${ResponseCode.SIGNED_BY_EMAIL}, ${ResponseCode.DELETED_USER}`,
  })
  @ApiResponse({ status: 404, description: ResponseCode.EMAIL_NOT_EXIST })
  @Get('login/oauth-kakao')
  @DisableSuccessInterceptor()
  @IsPublic()
  async kakaoOauthLoginCallback(@Query() query: KakaoCodeDto, @Res({ passthrough: true }) response: Response) {
    const kakaoUserInfo = await this.kakaoOauthService.getUserInfo(query.code, this.KAKAO_LOGIN_REDIRECT_URI);

    if (kakaoUserInfo === null) {
      // 카카오 유저 정보를 에러로 못 가져온 경우 이전 로그인 페이지로 이동
      return response.redirect(`${this.CLIENT_URL}/login?error=카카오계정 연동에 실패하였습니다.`);
    }

    const user = await this.userService.verifyKakaoUser(kakaoUserInfo.email);

    if ('error' in user) {
      return response.redirect(`${this.CLIENT_URL}/login?error=${user.error}`);
    }

    await this.authService.generateTokens(user.id, user.email, response);
    await this.setClientInCookie(response);

    return response.redirect(`${this.CLIENT_URL}/mykloud`);
  }

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  @IsPublic()
  async logout(@Res({ passthrough: true }) response: Response) {
    await this.authService.expireTokens(response);
    response.cookie('client_in', '', { maxAge: 0 });
    return {};
  }

  @ApiOperation({ summary: '회원탈퇴' })
  @Delete()
  @UseInterceptors(TransactionInterceptor)
  async deleteMe(
    @Res({ passthrough: true }) response: Response,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;

    await this.userService.deleteUser(user, queryRunner);
    await this.authService.expireTokens(response);

    return {};
  }

  private async setClientInCookie(response: Response) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);

    const cookieOptions = {
      expires: date,
      secure: this.MODE === 'production' ? true : false,
      sameSite: 'lax',
      path: '/',
      domain: this.HOST,
    } as CookieOptions;

    response.cookie('client_in', 'true', cookieOptions);
  }
}
