import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

config();

const configService = new ConfigService();

const isProd = process.env.ENV === 'production';

const dbHost = configService.get(isProd ? 'PROD_DB_HOST' : 'DB_HOST');
const dbPassword = configService.get(isProd ? 'PROD_DB_PASSWORD' : 'DB_PASSWORD');
const dbPort = +configService.get(isProd ? 'PROD_DB_PORT' : 'DB_PORT'); // int 변환을 위해 + 적용
const dbUsername = configService.get(isProd ? 'PROD_DB_USERNAME' : 'DB_USERNAME');
const dbName = configService.get(isProd ? 'PROD_DB_NAME' : 'DB_NAME');

const dbSync = 'false';
const dbLogging = 'false';

const connectionSource = new DataSource({
  type: 'mysql',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  timezone: '+09:00', //  TypeORM이 KST(UTC+9:00) 시간을 사용하도록 강제
  poolSize: 20, // TypeORM이 사용할 데이터베이스 연결 수의 제한을 설정. 20이면 TypeORM은 동시에 20개의 데이터베이스 연결을 유지함
  entities: ['dist/src/modules/**/entities/*.entity.{ts,js}'], // 엔티티의 경로를 __dirname으로 못읽기 때문에 dist를 이용
  synchronize: JSON.parse(dbSync), // true면 entity class 변경될때마다 테이블 자동 변경됨. 테이블이 DB에 없는 상태여도 entity를 import하면 테이블이 자동으로 생긴다. entity가 수정되어 DB에 반영되어도 할당된 값들이 날아가지는 않지만 production에서는 false로 해야 데이터 손실을 막을 수 있다.
  logging: JSON.parse(dbLogging),
  namingStrategy: new SnakeNamingStrategy(), // TypeORM의 엔티티의 필드명을 자동으로 스네이크 케이스로 변환해주는 네이밍 전략 클래스(ex. deletedAt -> daleted_at으로 DB 컬럼 저장됨)
  extra: {
    decimalNumbers: true, // TypeORM이 숫자 값을 반환할 때 소수점 이하 자릿수를 유지할 것인지 여부를 설정하는 옵션 (true: 소숫점 이하 자릿수 유지)
  },
  // * 마이그레이션 설정
  migrations: ['dist/src/migrations/*.{ts,js}'], // 마이그레이션할 파일 경로
  migrationsTableName: 'migrations', // 마이그레이션 기록될 테이블명
  dropSchema: false,
});

export default connectionSource;
