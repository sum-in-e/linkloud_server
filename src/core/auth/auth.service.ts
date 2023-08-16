import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { parse } from 'querystring';
import { User } from 'src/modules/user/entities/user.entity';
import { cookieOptions } from 'src/modules/user/utils/cookie';

function parseCookies(cookies: string) {
  return parse(cookies, '; ');
}
@Injectable()
export class AuthService {
  private readonly JWT_SECRET_KEY: string;
  private readonly MODE: string;
  private readonly HOST: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_SECRET_KEY = this.configService.getOrThrow('JWT_SECRET_KEY');
    this.MODE = this.configService.getOrThrow('MODE');
    this.HOST = this.configService.getOrThrow('HOST');
  }

  /**
   * @description id에 해당하는 유저를 찾는 메서드(AuthGuard 전용)
   */
  async findUserByIdForAuthGuard(id: number, response: Response): Promise<User> {
    const user = await this.userRepository.findUserByIdForAuthGuard(id);
    if (!user) {
      await this.expireTokens(response); // 토큰 해석해서 유저 id 가져왔는데 못 찾았으면 토큰 만료시키기 (혹시 몰라서)
      throw new CustomHttpException(ResponseCode.USER_NOT_EXIST, '잘못된 접근입니다. 로그인이 필요합니다.');
    }

    return user;
  }

  async validateToken(request: Request, response: Response): Promise<any> {
    // 💡 토큰이 httponlycookie에 저장된 경우 브라우저에 의해 자동으로 Cookie 헤더에 첨부되어 보내진다. -> request.headers.cookie에서 찾을 수 있다.
    // 💡 이 경우 Authorization 헤더가 아닌 cookie 헤더를 확인하여 토큰을 추출하므로 클라이언트에서는 요청 시 Autorization 헤더를 보낼 필요가 없다.
    const cookies = request.headers.cookie;

    if (!cookies) {
      throw new CustomHttpException(ResponseCode.AUTHENTICATION_REQUIRED, ResponseCode.AUTHENTICATION_REQUIRED, {
        status: 401,
      });
    }

    const parsedCookies = parseCookies(cookies);
    const accessToken = parsedCookies['sq'] as string;

    try {
      const decoded = await this.jwtService.verifyAsync(accessToken, {
        secret: this.JWT_SECRET_KEY,
      }); // 검증 실패 시 catch 블록으로 이동함

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'name' in error) {
        const e = error as { name?: string };
        if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
          // 액세스 토큰 검사했는데 만료 등 문제가 있다 -> 리프레시 토큰 확인
          try {
            const refreshToken = parsedCookies['bp'] as string;

            const decoded = await this.jwtService.verifyAsync(refreshToken, {
              secret: this.JWT_SECRET_KEY,
            }); // 검증 실패 시 catch 블록으로 이동함

            // 리프레시 토큰은 있고 문제도 없다. -> 토큰 둘다 갱신 하고 API 요청 수행
            await this.generateTokens(decoded.userId, decoded.email, response);

            return {
              userId: decoded.userId,
              email: decoded.email,
            };
          } catch (error) {
            // 리프레시 토큰 없거나 문제가 있다 -> 에러 던지고 끝 (로그인 필요)
            throw new CustomHttpException(ResponseCode.AUTHENTICATION_EXPIRED, ResponseCode.AUTHENTICATION_EXPIRED, {
              status: 401,
            });
          }
        }
      }

      throw new CustomHttpException(ResponseCode.UNKNOWN_ERROR, ResponseCode.UNKNOWN_ERROR, {
        status: 401,
      });
    }
  }

  /**
   * @description JWT로 액세스토큰과 리프레시 토큰 생성하고 응답 헤더에 저장하는 메서드
   */
  async generateTokens(userId: number, email: string, response: Response): Promise<void> {
    const payload = { userId, email };

    try {
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d', secret: this.JWT_SECRET_KEY });
      const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '30d', secret: this.JWT_SECRET_KEY });
      response.cookie('sq', accessToken, cookieOptions(this.HOST));
      response.cookie('bp', refreshToken, cookieOptions(this.HOST));
    } catch (error) {
      throw new CustomHttpException(
        ResponseCode.INTERNAL_SERVER_ERROR,
        `${ResponseCode.GENERATE_TOKEN_FAILED} ${error}`,
        { status: 500 },
      );
    }
  }

  /**
   * @description 액세스토큰과 리프레시 토큰을 만료시키는 메서드
   */
  async expireTokens(response: Response): Promise<void> {
    response.cookie('sq', '', { ...cookieOptions(this.HOST), maxAge: 0 });
    response.cookie('bp', '', { ...cookieOptions(this.HOST), maxAge: 0 });
  }
}
