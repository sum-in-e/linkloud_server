import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from 'src/modules/notification/services/notification.service';

@Injectable()
export class NotificationScheduler {
  constructor(private readonly notificationService: NotificationService) {}
  @Cron('0 21 * * 2', { timeZone: 'Asia/Seoul' }) // 매주 화요일 오후 9시 (KST)
  @Cron('0 21 * * 4', { timeZone: 'Asia/Seoul' }) // 매주 목요일 오후 9시 (KST)
  @Cron('0 21 * * 0', { timeZone: 'Asia/Seoul' }) // 매주 일요일 오후 9시 (KST)
  async handleSundayCron(): Promise<void> {
    await this.notificationService.sendNotification();
  }
}
