import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpResponseBuilder } from 'src/core/http/util/http-response-builder';

@Injectable()
export class SuccessInterceptor<T> implements NestInterceptor {
  constructor(private readonly httpResponseBuilder: HttpResponseBuilder, private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 핸들러 함수에서 disableSuccessInterceptor 메타데이터를 가져온다.
    const hasToDisable = this.reflector.get<boolean>('disableSuccessInterceptor', context.getHandler());

    if (hasToDisable) {
      // * @DisableSuccessInterceptor 데코레이터가 선언된 컨트롤러나 핸들러 함수에서는 SuccessInterceptor 로직을 실행하지 않는다.
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // data는 컨트롤러에서 리턴한 값

        // 💡 컨트롤러에서 return하는 값은 Promise나 Observable로 감싸져야 인터셉터에서 받을 수 있다. (무조건 return 한다고 인터셉터의 data안에 있을 거라고 생각하지 말 것)
        const status = context.switchToHttp().getResponse().statusCode;
        const responseData = data; // 넘겨줄 데이터가 없으면 {}라도 리턴시키기

        return this.httpResponseBuilder.buildSuccessResponse<T>(status, responseData);
      }),
    );
  }
}
