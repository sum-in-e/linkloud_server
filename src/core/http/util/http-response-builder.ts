import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { ErrorResponse, SuccessResponse } from 'src/core/http/types/http-response.type';

@Injectable()
export class HttpResponseBuilder {
  // 모든 예외 처리 발생 시 전역으로 설정한 HttpExceptionFilter를 거치게 되므로 HttpExceptionFilter에서 buildErrorResponse를 사용해 에러 응답 형태를 일관성 있게 유지한다.
  buildErrorResponse(status: HttpStatus, message: string, code: ResponseCode, data?: unknown): ErrorResponse {
    return {
      status, // ex. 400, 401, 404, 500 etc..
      message,
      error: {
        code,
        data,
      },
    };
  }

  // 전역으로 설정한 SuccessInterceptor에서 성공 응답을 가로채므로 SuccessInterceptor에서 buildSuccessResponse를 사용하여 성공 형태를 일관성 있게 유지한다.
  buildSuccessResponse<T>(status: HttpStatus, data: T): SuccessResponse<T> {
    return {
      status, // ex. 200, 201, 204 etc..
      message: ResponseCode.OK,
      data,
    };
  }
}
