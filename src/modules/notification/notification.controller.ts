import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { SubscriptionDto } from 'src/modules/notification/dto/subscription.dto';
import { SubscriptionService } from 'src/modules/notification/services/subscription.service';

@ApiTags('알림/구독 APIs')
@Controller('subscription')
export class NotificationController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiOperation({
    summary: '구독 정보 저장 API',
    description: '클라이언트에서 전송한 구독 정보를 저장합니다.',
  })
  @Post('')
  async subscribe(@Body() body: SubscriptionDto, @Req() request: RequestWithUser) {
    const user = request.user;

    await this.subscriptionService.subscribe(body, user);
    return {};
  }

  @ApiOperation({
    summary: '구독 확인 API',
    description: '클라이언트가 보낸 구독 정보가 DB에 저장되어있는지 확인합니다.',
  })
  @Post('check-subscription')
  async checkSubscription(@Body() body: SubscriptionDto, @Req() request: RequestWithUser) {
    const user = request.user;

    return await this.subscriptionService.checkSubscription(body, user);
  }

  @ApiOperation({
    summary: '푸쉬 구독 정보 삭제 API',
    description: 'DB에 저장된 푸쉬 구독 정보를 삭제합니다.',
  })
  @Post('delete-subscription')
  async deleteSubscription(@Body() body: SubscriptionDto, @Req() request: RequestWithUser) {
    const user = request.user;

    await this.subscriptionService.deleteSubscription(body, user);
    return {};
  }
}
