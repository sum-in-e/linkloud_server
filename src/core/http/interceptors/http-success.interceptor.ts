import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from 'src/core/http/types/http-response.type';
import { HttpResponseBuilder } from 'src/core/http/util/http-response-builder';

@Injectable()
export class SuccessInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  constructor(private readonly httpResponseBuilder: HttpResponseBuilder) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const status = context.switchToHttp().getResponse().statusCode;
        const responseData = data || {};

        return this.httpResponseBuilder.buildSuccessResponse(status, responseData);
      }),
    );
  }
}
