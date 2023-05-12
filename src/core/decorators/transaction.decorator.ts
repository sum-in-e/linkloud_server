import { createParamDecorator, ExecutionContext } from '@nestjs/common';
/**
 * @description ExecutionContext에서 QeuryRunner 인스턴스를 추출하며, TransactionInterceptor와 함께 핸들러 함수에서 트랜잭션을 사용하게 해준다.
 */
export const TransactionManager = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.queryRunner;
});
