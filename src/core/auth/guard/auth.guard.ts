import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from 'src/core/auth/auth.service';
import { IS_PUBLIC_KEY } from 'src/core/auth/decorator/is-public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const handler = context.getHandler();

    const isPublic = this.reflector.get(IS_PUBLIC_KEY, handler);
    if (isPublic) {
      return true;
    }

    // 토큰 유효성 검사
    const { userId } = await this.authService.validateToken(request, response);

    // 액세스 토큰 있고 문제도 없으면 API 요청 수행
    const user = await this.authService.findUserByIdForAuthGuard(parseInt(userId, 10));
    request.user = user; //💡인증이 성공한 사용자의 정보를 request 객체에 담아서 컨트롤러에서 사용할 수 있도록 하기 위함. 사용자의 id나 email 등을 알아야 하는 경우에 request.user를 통해 접근할 수 있다. 이렇게 하면 컨트롤러에서 매번 데이터베이스에서 사용자 정보를 조회할 필요가 없다.
    return true;
  }
}
