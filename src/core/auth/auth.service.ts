import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Request, Response } from 'express';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import { parse } from 'querystring';

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
   * @description 유저가 존재하면 유저 객체를 반환하고, 존재하지 않으면 에러를 발생시키는 메서드
   */
  async findUserByEmail(email: string) {
    // TODO: 나중에는 휴면계정도 예외 처리 해야하지 않을까
    const user = await this.userRepository.findUserByEmailWithoutDeleted(email);

    if (!user) {
      throw new CustomHttpException(ResponseCode.USER_NOT_EXIST, '존재하지 않는 유저입니다.');
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
      });

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'name' in error) {
        const e = error as { name?: string };
        if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
          // 액세스 토큰 검사했는데 만료는 등 문제가 있다 -> 리프레시 토큰 확인
          try {
            const refreshToken = parsedCookies['rft'] as string;
            const decoded = await this.jwtService.verifyAsync(refreshToken, {
              secret: this.JWT_SECRET_KEY,
            });

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
   * @description JWT로 액세스토 큰과 리프레시 토큰 생성하고 응답 헤더에 저장하는 메서드
   */
  async generateTokens(userId: number, email: string, response: Response): Promise<void> {
    const cookieOptions = {
      httpOnly: true,
      secure: this.MODE === 'production' ? true : false,
      sameSite: 'lax',
    } as CookieOptions;

    const payload = { userId, email };

    try {
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d', secret: this.JWT_SECRET_KEY });
      const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '30d', secret: this.JWT_SECRET_KEY });

      response.cookie('act', accessToken, cookieOptions);
      response.cookie('rft', refreshToken, cookieOptions);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.GENERATE_TOKEN_FAILED, `${error}`, { status: 500 });
    }
  }
}
