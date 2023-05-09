import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

interface HttpErrorOption {
  status?: number;
  data?: unknown; // any 대신 unknown을 사용
}

export class CustomHttpException extends HttpException {
  public code: ResponseCode;
  public data: unknown;

  constructor(responseCode: ResponseCode, message?: string, option?: HttpErrorOption) {
    super(
      {
        code: responseCode,
        message: message || ResponseCode[responseCode] || ResponseCode.UNKNOWN_ERROR,
        data: option?.data || null,
      },
      option?.status || HttpStatus.BAD_REQUEST,
    );

    // 생성자에서 클래스에서 정의한 모든 속성을 초기화
    this.code = responseCode;
    this.data = option?.data;
  }
}
