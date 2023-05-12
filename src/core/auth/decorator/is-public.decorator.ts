import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * @description 권한 검사가 불필요한 라우터에 설정 시 AuthGuard를 타지 않도록합니다.
 */
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);
