import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Injectable()
export class typeORMConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const mode = this.configService.get('MODE', 'develop');
    const dbHost = this.configService.getOrThrow('DB_HOST');
    const dbPort = +this.configService.get('DB_PORT', 3306); // int 변환을 위해 + 적용
    const dbUsername = this.configService.get('DB_USERNAME');
    const dbPassword = this.configService.getOrThrow('DB_PASSWORD');
    const dbName = this.configService.get('DB_NAME', 'linkloud');
    const dbSync = mode === 'develop' ? 'true' : 'false';
    const dbLogging = mode === 'develop' ? 'false' : 'true';

    return {
      type: 'mysql',
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      database: dbName,
      timezone: '+09:00', //  TypeORM이 KST(UTC+9:00) 시간을 사용하도록 강제
      poolSize: 20, // TypeORM이 사용할 데이터베이스 연결 수의 제한을 설정. 20이면 TypeORM은 동시에 20개의 데이터베이스 연결을 유지함
      entities: [join(__dirname, '../modules/**/entities/*.entity.{ts,js}')], // 엔티티 파일의 위치이며, 엔티티를 이용해서 데이터베이스 테이블을 생성한다.
      synchronize: JSON.parse(dbSync), // true면 entity class 변경될때마다 테이블 자동 변경됨. 테이블이 DB에 없는 상태여도 entity를 import하면 테이블이 자동으로 생긴다. entity가 수정되어 DB에 반영되어도 할당된 값들이 날아가지는 않지만 production에서는 false로 해야 데이터 손실을 막을 수 있다.
      logging: JSON.parse(dbLogging),
      namingStrategy: new SnakeNamingStrategy(), // TypeORM의 엔티티의 필드명을 자동으로 스네이크 케이스로 변환해주는 네이밍 전략 클래스(ex. deletedAt -> daleted_at으로 DB 컬럼 저장됨)
      extra: {
        decimalNumbers: true, // TypeORM이 숫자 값을 반환할 때 소수점 이하 자릿수를 유지할 것인지 여부를 설정하는 옵션 (true: 소숫점 이하 자릿수 유지)
      },
    };
  }
}
