import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';
import { IncomingWebhook } from '@slack/client';
import dayjs from 'dayjs';

@Injectable()
export class SentryProvider {
  private webhook: IncomingWebhook;
  private readonly sentryDSN: string;
  private readonly webhookUrl: string;

  constructor(private configService: ConfigService) {
    this.sentryDSN = configService.getOrThrow('SENTRY_DSN');
    this.webhookUrl = configService.getOrThrow('SLACK_WEBHOOK_URL_FOR_SENTRY');

    Sentry.init({
      dsn: this.sentryDSN,
    });

    this.webhook = new IncomingWebhook(this.webhookUrl);
  }

  public captureException(exception: any) {
    Sentry.captureException(exception);

    if (this.webhook) {
      const message = {
        text: '🚨링클라우드 서버 버그 발생🚨',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨링클라우드 서버 버그 발생🚨*\n*${exception.name}*: ${exception.message}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`\`\`${exception.stack}\`\`\``,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Occurred at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
              },
            ],
          },
        ],
      };
      this.webhook.send(message);
    }
  }
}
