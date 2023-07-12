import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SubscriptionDto {
  @ApiProperty({ description: '푸시 알림을 전달하기 위한 URL로, 브라우저에서 제공하는 Push 서비스의 URL' })
  @IsNotEmpty()
  @IsString()
  endpoint!: string;

  @ApiProperty({
    description:
      'PushManager.subscribe 메서드를 사용하여 푸시 구독을 생성할 때 자동으로 생성되며 인증을 위한 키로 사용된다.',
  })
  @IsNotEmpty()
  @IsObject()
  keys!: {
    auth: string;
    p256dh: string;
  };
}
