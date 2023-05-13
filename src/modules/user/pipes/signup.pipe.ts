import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

@Injectable()
export class SignUpPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value; // metatype이 없거나 유효성 검사가 필요없는 타입이면 value를 그대로 반환
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    errors.forEach((error) => {
      if (error.property === 'password') {
        //  비밀번호 양식에 맞지 않음
        throw new CustomHttpException(
          ResponseCode.INVALID_PASSWORD_FORMAT,
          '비밀번호는 영문, 숫자, 특수문자를 모두 포함하는 8~15자 조합이어야 합니다.',
        );
      }
      if (error.property === 'name') {
        // 닉네임 형식에 맞지 않음
        throw new CustomHttpException(ResponseCode.INVALID_USER_NAME_FORMAT, '유저명은 2~15자 이내여야 합니다.');
      }
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
