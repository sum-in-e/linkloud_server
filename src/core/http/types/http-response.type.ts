import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

export interface ErrorResponse {
  status: number;
  message: string;
  error: {
    code: ResponseCode;
    data: unknown;
  };
}

export interface SuccessResponse<T> {
  status: number;
  message: string;
  data: T;
}
