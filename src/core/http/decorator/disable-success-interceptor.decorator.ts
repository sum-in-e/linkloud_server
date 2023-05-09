import { SetMetadata } from '@nestjs/common';

/**
 * @description - DisableSuccessInterceptor 데코레이터를 사용한 핸들러 함수에 disableSuccessInterceptor라는 메타데이터를 추가한다.
 * SuccessInterceptor에 disableSuccessInterceptor 메타데이터가 넘어오면 로직을 실행하지 않고 패스하기 위함.
 */
export const DisableSuccessInterceptor = () => SetMetadata('disableSuccessInterceptor', true);
