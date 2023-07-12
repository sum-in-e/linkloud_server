import { Module } from '@nestjs/common';
import { SubscriptionService } from './services/subscription.service';
import { NotificationController } from 'src/modules/notification/notification.controller';
import { SubscriptionRepository } from 'src/modules/notification/repository/subscription.repository';
import { Subscription } from 'src/modules/notification/entities/subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/modules/user/user.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), UserModule],
  controllers: [NotificationController],
  providers: [SubscriptionService, SubscriptionRepository, ConfigService],
  exports: [SubscriptionRepository],
})
export class NotificationnModule {}
