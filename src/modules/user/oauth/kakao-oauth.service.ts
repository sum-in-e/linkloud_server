import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { JwtUtil } from 'src/modules/user/utils/jwt.util';
import { SentryProvider } from 'src/common/sentry/sentry.provider';

@Injectable()
export class KakaoOauthService {
  private readonly KAKAO_REST_API_KEY: string;
  private readonly MODE: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtUtil: JwtUtil,
    private readonly sentry: SentryProvider,
  ) {
    this.KAKAO_REST_API_KEY = this.configService.getOrThrow('KAKAO_REST_API_KEY');
    this.MODE = this.configService.getOrThrow('MODE');
  }

  /**
   * @remarks 인가 코드로 카카오 서버에 토큰을 요청하고 응답으로 받은 id_token에서 유저 정보를 추출해 반환하는 메서드
   * @param code - 인가 코드 받기 요청으로 얻은 인가 코드
   * @returns {email, sub}
   */
  async getUserInfo(code: string, redirect_uri: string): Promise<{ email: string; sub: string } | null> {
    try {
      const kakaoResonse = await lastValueFrom(
        this.httpService.post(`https://kauth.kakao.com/oauth/token`, null, {
          params: {
            grant_type: 'authorization_code', // 인가 코드로 토큰을 받기 위해 authorization_code로 설정
            client_id: this.KAKAO_REST_API_KEY,
            redirect_uri, // 인가 코드가 리다이렉트된 URI
            code,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        }),
      );

      const { id_token } = kakaoResonse.data;

      const { payloadJson } = await this.jwtUtil.decodeJWT(id_token);
      const { email, sub } = payloadJson; // 페이로드에서 사용자의 email을 가져온다

      return { email, sub };
    } catch (error) {
      if (this.MODE === 'production') {
        this.sentry.captureException(error);
      }
      return null;
    }
  }
}
