import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * @description 트랜잭션을 관리하기위한 인터셉터
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const queryRunner: QueryRunner = await this.startTransaction();

    req.queryRunner = queryRunner;

    return next.handle().pipe(
      tap(async () => {
        // 성공적으로 완료 시 트랜잭션 커밋
        await queryRunner.commitTransaction();
        await queryRunner.release();
        console.log('commitTransaction');
      }),
      catchError(async (err) => {
        // 오류 발생 시 트랜잭션 롤백
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        console.log('🚨rollbackTransaction🚨');
        throw err;
      }),
    );
  }
  // 트랜잭션 시작
  private async startTransaction(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return queryRunner;
  }
}
