import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { JwtUtil } from 'src/modules/user/utils/jwt.util';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

@Injectable()
export class KakaoOauthService {
  private readonly KAKAO_REST_API_KEY: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtUtil: JwtUtil,
  ) {
    this.KAKAO_REST_API_KEY = this.configService.getOrThrow('KAKAO_REST_API_KEY');
  }

  /**
   * @remarks 인가 코드로 카카오 서버에 토큰을 요청하고 응답으로 받은 id_token을 반환하는 메서드
   * @param code - 인가 코드 받기 요청으로 얻은 인가 코드
   * @returns id_token
   */
  async getUserInfo(code: string, redirect_uri: string): Promise<{ email: string; sub: string }> {
    try {
      const kakaoResonse = await lastValueFrom(
        this.httpService.post(`https://kauth.kakao.com/oauth/token`, null, {
          params: {
            grant_type: 'authorization_code', // 인가 코드로 토큰을 받기 위해 authorization_code로 설정
            client_id: this.KAKAO_REST_API_KEY,
            redirect_uri: redirect_uri, // 인가 코드가 리다이렉트된 URI
            code,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        }),
      );
      const { access_token, id_token } = kakaoResonse.data;

      const { payloadJson } = await this.jwtUtil.decodeJWT(id_token);
      const { email, sub } = payloadJson; // 페이로드에서 사용자의 email을 가져온다

      return { email, sub };
    } catch (error) {
      throw new CustomHttpException(
        ResponseCode.SIGN_UP_FAILED,
        '카카오 서버와의 연동 실패로 회원가입에 실패하였습니다.',
      );
    }
  }
}
