import { Module } from '@nestjs/common';
import { CustomLogger } from 'src/core/logger/logger.provider';

@Module({
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
