import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationDto {
  @IsEmail()
  @ApiProperty({
    description: '인증번호 발송할 이메일',
    example: 'user@linkloud.co.kr',
  })
  email!: string;
}
