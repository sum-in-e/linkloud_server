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
  timezone: '+00:00',
  poolSize: 20,
  entities: ['dist/src/modules/**/entities/*.entity.{ts,js}'],
  synchronize: JSON.parse(dbSync),
  logging: JSON.parse(dbLogging),
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    decimalNumbers: true,
  },
  // * 마이그레이션 설정
  migrations: ['dist/src/migrations/*.{ts,js}'], // 마이그레이션할 파일 경로
  migrationsTableName: 'migrations', // 마이그레이션 기록될 테이블명
  dropSchema: false,
});

export default connectionSource;
