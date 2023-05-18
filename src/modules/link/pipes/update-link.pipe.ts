import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

@Injectable()
export class UpdateLinkPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value; // metatype이 없거나 유효성 검사가 필요없는 타입이면 value를 그대로 반환
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    errors.forEach((error) => {
      if (error.property === 'url') {
        throw new CustomHttpException(ResponseCode.INVALID_URL, '유효하지 않은 형식의 url 입니다.');
      }
      if (error.property === 'title') {
        throw new CustomHttpException(ResponseCode.LINK_TITLE_IS_REQUIRED, '링크 제목은 필수입니다.');
      }
      if (error.property === 'isInMyCollection') {
        throw new CustomHttpException(ResponseCode.INVALID_PARAMS);
      }
    });

    return value; // 에러가 없으면 value를 그대로 반환
  }

  private toValidate(metatype: any): boolean {
    return ![String, Boolean, Number, Array, Object].includes(metatype); // metatype이 기본 타입이 아니면 true를 반환
  }
}
