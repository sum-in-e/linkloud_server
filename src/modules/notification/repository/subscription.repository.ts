import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionDto } from 'src/modules/notification/dto/subscription.dto';
import { Subscription } from 'src/modules/notification/entities/subscription.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async findSubscription(body: SubscriptionDto, user: User): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { endpoint: body.endpoint, user: { id: user.id } },
    });
  }

  async subscribe(body: SubscriptionDto, user: User): Promise<Subscription> {
    const subscription = new Subscription();
    subscription.endpoint = body.endpoint;
    subscription.keys = body.keys;
    subscription.user = user;
    return await this.subscriptionRepository.save(subscription);
  }

  async removeInvalidSubscription(endpoint: string, user: User): Promise<DeleteResult> {
    return await this.subscriptionRepository.delete({ endpoint, user: { id: user.id } });
  }
}
