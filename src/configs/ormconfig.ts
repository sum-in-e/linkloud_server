import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// * 🚨typeORMConfig 수정 시 마이그레이션을 위해 사용하는 datasource 파일도 동일하게 수정하기🚨
@Injectable()
export class typeORMConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const mode = this.configService.getOrThrow('MODE', 'development');
    const isDevelopment = mode === 'development';

    const dbHost = this.configService.getOrThrow('DB_HOST');
    const dbPassword = this.configService.getOrThrow('DB_PASSWORD');
    const dbPort = +this.configService.getOrThrow('DB_PORT'); // int 변환을 위해 + 적용
    const dbUsername = this.configService.getOrThrow('DB_USERNAME');
    const dbName = this.configService.getOrThrow('DB_NAME', 'linkloud');
    const dbSync = 'false';
    // const dbSync = isDevelopment ? 'true' : 'false';
    const dbLogging = isDevelopment ? 'false' : 'true';

    return {
      type: 'mysql',
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      database: dbName,
      timezone: '+00:00',
      poolSize: 20, // TypeORM이 사용할 데이터베이스 연결 수의 제한을 설정. 20이면 TypeORM은 동시에 20개의 데이터베이스 연결을 유지함
      entities: [join(__dirname, '../modules/**/entities/*.entity.{ts,js}')], // 엔티티 파일의 위치이며, 엔티티를 이용해서 데이터베이스 테이블을 생성한다.
      synchronize: JSON.parse(dbSync),
      logging: JSON.parse(dbLogging),
      namingStrategy: new SnakeNamingStrategy(), // TypeORM의 엔티티의 필드명을 자동으로 스네이크 케이스로 변환해주는 네이밍 전략 클래스(ex. deletedAt -> daleted_at으로 DB 컬럼 저장됨)
      extra: {
        decimalNumbers: true, // TypeORM이 숫자 값을 반환할 때 소수점 이하 자릿수를 유지할 것인지 여부를 설정하는 옵션 (true: 소숫점 이하 자릿수 유지)
      },
    };
  }
}
