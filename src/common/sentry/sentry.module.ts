import { Module } from '@nestjs/common';
import { SentryProvider } from 'src/common/sentry/sentry.provider';

@Module({
  providers: [SentryProvider],
  exports: [SentryProvider],
})
export class SentryModule {}
