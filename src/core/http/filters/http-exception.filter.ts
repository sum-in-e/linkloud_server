import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { CustomHttpException } from 'src/core/http/http-exception';
import { HttpResponseBuilder } from 'src/core/http/util/http-response-builder';
import { CustomLogger } from 'src/core/logger/logger.provider';
import { SentryProvider } from 'src/common/sentry/sentry.provider';
import { ConfigService } from '@nestjs/config';

@Catch() // 모든 예외를 캐치
export class HttpExceptionFilter {
  private readonly mode: string;

  constructor(
    private readonly httpResponseBuilder: HttpResponseBuilder,
    private readonly logger: CustomLogger,
    private readonly sentry: SentryProvider,
    private readonly configService: ConfigService,
  ) {
    this.mode = this.configService.get('MODE', 'development');
  }

  catch(exception: CustomHttpException | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let code: ResponseCode;
    let status: number;
    let message: string = exception.message;
    let data: unknown | null = null;

    const isProduction = this.mode === 'production';
    const method = request.method;
    const url = request.url;
    const body = request.body ? `${JSON.stringify(request.body)}` : '-';

    // 예외 객체가 HttpException 타입인지 확인
    if (exception instanceof HttpException) {
      // * HttpException 타입일 경우
      status = exception.getStatus();
      data = null;
      if (exception instanceof CustomHttpException) {
        // 커스텀 예외 객체일 경우
        code = exception.code;
        if (exception.data) data = exception.data;

        this.logger.error(`[${method}] ${url} \nException: ${exception.message}`); // 👾사용자 정의(예측 가능한) 에러는 최소한의 정보만 던진다.
      } else {
        //  정의하지 않은 HttpException일 경우
        code = ResponseCode.UNKNOWN_ERROR;

        // 👾 로깅
        if (isProduction) this.sentry.captureException(exception);
        this.logger.error(`[${method}] ${url} \nException:${exception.message} \nbody:${body}`);
      }
    } else {
      // * HttpException 타입이 아닐 경우 -> 500에러
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ResponseCode.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';

      // 👾 로깅
      if (isProduction) this.sentry.captureException(exception);
      this.logger.error(`[${method}] ${url} \nbody:${body}`);
    }

    response.status(status).json(this.httpResponseBuilder.buildErrorResponse(status, message, code, data));
  }
}
