import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { SubscriptionDto } from 'src/modules/notification/dto/subscription.dto';
import { Subscription } from 'src/modules/notification/entities/subscription.entity';
import { SubscriptionRepository } from 'src/modules/notification/repository/subscription.repository';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class SubscriptionService {
  private readonly VAPID_PUBLIC_KEY: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {
    this.VAPID_PUBLIC_KEY = this.configService.getOrThrow('VAPID_PUBLIC_KEY');
  }

  /**
   * @description 공개키 반환
   */
  async getPublicKey(): Promise<{ publicKey: string }> {
    return { publicKey: this.VAPID_PUBLIC_KEY };
  }

  /**
   * @description DB에 구독 정보 저장
   */
  async subscribe(body: SubscriptionDto, user: User): Promise<Subscription> {
    try {
      return await this.subscriptionRepository.subscribe(body, user);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '구독 정보 저장에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  /**
   * @description 구독 정보가 DB에 등록되어있는지를 확인
   */
  async checkSubscription(body: SubscriptionDto, user: User): Promise<{ status: 'valid' }> {
    const result = await this.subscriptionRepository.findSubscription(body, user);

    if (!result) {
      throw new CustomHttpException(ResponseCode.SUBSCRIPTION_NOT_FOUND, ResponseCode.SUBSCRIPTION_NOT_FOUND, {
        status: 404,
      });
    }

    return { status: 'valid' };
  }
}
