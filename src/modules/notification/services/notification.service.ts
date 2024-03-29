import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionRepository } from 'src/modules/notification/repository/subscription.repository';
import { SubscriptionInfoType } from 'src/modules/notification/types/subscription.type';
import { UserRepository } from 'src/modules/user/repository/user.repository';
import webpush from 'web-push';

@Injectable()
export class NotificationService {
  private readonly VAPID_PUBLIC_KEY: string;
  private readonly VAPID_PRIVATE_KEY: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {
    this.VAPID_PUBLIC_KEY = this.configService.getOrThrow('VAPID_PUBLIC_KEY');
    this.VAPID_PRIVATE_KEY = this.configService.getOrThrow('VAPID_PRIVATE_KEY');

    // web-push 라이브러리 초기화
    webpush.setVapidDetails('https://linkloud.xyz', this.VAPID_PUBLIC_KEY, this.VAPID_PRIVATE_KEY);
  }

  /**
   * @description 알림 발송
   */
  async sendNotification(): Promise<void> {
    const users = await this.userRepository.findUsersWithUncheckedLinksOverTen();

    if (users.length === 0) {
      return;
    }

    // 각 사용자와 구독 브라우저에 대해 web-push 라이브러리를 사용하여 알림을 보낸다.
    for (const user of users) {
      for (const subscription of user.subscriptions) {
        const subscriptionInfo: SubscriptionInfoType = {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
          },
        };

        const notificationDataArray = [
          {
            title: '흥미로운 링크를 담아두셨네요?👀',
            description: '저장한 글을 읽고 더 성장한 나를 만나보세요!',
          },
          {
            title: '새로운 인사이트를 찾아보세요!',
            description: '아직 읽지 않은 링크들로부터 새로운 인사이트를 찾아보세요!',
          },
          {
            title: '성장의 기회가 기다리고 있어요!',
            description: '읽지 않은 링크들을 확인하고, 새로운 지식을 획득하세요!',
          },
          {
            title: '알아두면 좋을 정보들이 있어요!',
            description: '읽지 않은 링크들을 통해 더 많은 정보를 얻어보세요!',
          },
        ];

        const randomIndex = Math.floor(Math.random() * notificationDataArray.length);
        const notificationData = notificationDataArray[randomIndex];

        await webpush.sendNotification(subscriptionInfo, JSON.stringify(notificationData)).catch((error) => {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // 에러 코드가 410(Gone) 또는 404(Not Found)인 경우, 구독이 만료되었거나 존재하지 않으므로 데이터베이스에서 해당 구독 정보를 제거한다.
            // 에러가 발생한 구독 정보만 제외하고 나머지 구독에 대해서는 푸시 알림이 계속해서 전송된다.

            this.subscriptionRepository.removeInvalidSubscription(subscriptionInfo.endpoint, user);
          }
        });
      }
    }
  }
}
