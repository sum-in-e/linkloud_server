import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

@Injectable()
export class EmailVerificationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value; // metatype이 없거나 유효성 검사가 필요없는 타입이면 value를 그대로 반환
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors[0]) {
      // 에러가 있으면 error 배열 안에 error객체가 생김
      const isEmailError = errors[0].constraints?.hasOwnProperty('isEmail');

      if (isEmailError) {
        // isEmail 에러가 있으면 커스텀 예외를 던짐
        throw new CustomHttpException(ResponseCode.INVALID_EMAIL_FORMAT);
      }
    }

    return value; // 에러가 없으면 value를 그대로 반환
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find((type) => metatype === type); // metatype이 기본 타입이 아니면 true를 반환
  }
}
