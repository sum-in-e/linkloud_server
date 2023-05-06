import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

@Injectable()
export class KakaoSignUpPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value; // metatype이 없거나 유효성 검사가 필요없는 타입이면 value를 그대로 반환
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    errors.forEach((error) => {
      if (error.property === 'isAgreeProvidePersonalInfo' || error.property === 'isAgreeTermsOfUse') {
        // 약관 동의 안 한 경우
        throw new CustomHttpException(ResponseCode.TERMS_NOT_AGREED, '필수 약관 동의가 필요합니다.');
      }
    });

    return value; // 에러가 없으면 value를 그대로 반환
  }

  private toValidate(metatype: any): boolean {
    return ![String, Boolean, Number, Array, Object].includes(metatype); // metatype이 기본 타입이 아니면 true를 반환
  }
}
