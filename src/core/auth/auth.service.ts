import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Request, Response } from 'express';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { parse } from 'querystring';
import { User } from 'src/modules/user/entities/user.entity';

function parseCookies(cookies: string) {
  return parse(cookies, '; ');
}
@Injectable()
export class AuthService {
  private readonly JWT_SECRET_KEY: string;
  private readonly MODE: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_SECRET_KEY = this.configService.getOrThrow('JWT_SECRET_KEY');
    this.MODE = this.configService.getOrThrow('MODE');
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
    const accessToken = parsedCookies['act'] as string;

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
            const refreshToken = parsedCookies['rft'] as string;
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
    const cookieOptions = {
      httpOnly: true,
      secure: this.MODE === 'production' ? true : false,
      sameSite: 'lax',
      path: '/', // 설정하지 않을 경우, 기본적으로 쿠키가 설정된 페이지의 경로가 적용되므로 '/'으로 지정해서 서비스 전체 요청에서 사용할 수 있게 해야함(안하면 /login 페이지에서 쿠키 설정 요청하면 /login으로 설정되어버림)
      domain: this.MODE === 'production' ? 'linkloud.co.kr' : 'localhost', // 설정하지 않으면, 쿠키가 설정된 도메인이 쿠키의 도메인으로 설정되서 linkloud.co.kr에서 보내면 linkloud.co.kr로 설정된다. 하지만 명확하게 도메인을 설정해줘야 이 도메인과 하위 도메인에서만 쿠키를 사용할 수 있게 되므로 보안을 위해 설정하는 것이 좋다.
    } as CookieOptions;

    const payload = { userId, email };

    try {
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d', secret: this.JWT_SECRET_KEY });
      const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '30d', secret: this.JWT_SECRET_KEY });

      response.cookie('act', accessToken, cookieOptions);
      response.cookie('rft', refreshToken, cookieOptions);
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
    const cookieOptions = {
      httpOnly: true,
      secure: this.MODE === 'production' ? true : false,
      sameSite: 'lax',
      maxAge: 0,
    } as CookieOptions;

    response.cookie('act', '', cookieOptions);
    response.cookie('rft', '', cookieOptions);
  }
}
