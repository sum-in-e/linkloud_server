import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { CustomHttpException } from 'src/core/http/http-exception';
import { HttpResponseBuilder } from 'src/core/http/util/http-response-builder';

// TODO: Sentry 작업
@Catch() // 모든 예외를 캐치
export class HttpExceptionFilter {
  constructor(private readonly httpResponseBuilder: HttpResponseBuilder) {}

  private readonly logger = new Logger(HttpExceptionFilter.name); // 로거 인스턴스 생성

  catch(exception: CustomHttpException | HttpException, host: ArgumentsHost) {
    console.log('🚨HttpExceptionFilter🚨');

    // TODO: 로깅 시 어떤 정보들을 담는 게 좋은지 리서치 해서 적용
    // TODO: 배포한 서비스의 로그뷰어에서 볼 수 있는지 확인 필요
    this.logger.error(exception.message, exception.stack); // 예외 정보 로깅 -> 터미널에는 로깅된다!

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let code: ResponseCode;
    let status: number;
    const message: string = exception.message;

    // 예외 객체가 HttpException 타입인지 확인
    if (exception instanceof HttpException) {
      // * HttpException 타입일 경우
      status = exception.getStatus();
      if (exception instanceof CustomHttpException) {
        // 커스텀 예외 객체일 경우
        code = exception.code;
      } else {
        //  정의하지 않은 HttpException일 경우
        code = ResponseCode.UNKNOWN_ERROR;
      }
    } else {
      // * HttpException 타입이 아닐 경우 -> 500에러
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ResponseCode.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json(this.httpResponseBuilder.buildErrorResponse(status, message, code));
  }
}
