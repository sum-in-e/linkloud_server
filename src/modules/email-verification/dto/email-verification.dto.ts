import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationDto {
  @ApiProperty({
    description: '인증할 이메일',
    example: 'user@linkloud.xyz',
  })
  @IsEmail()
  email!: string;
}

export class EmailVerificationConfirmDto {
  @ApiProperty({
    description: '인증할 이메일',
    example: 'user@linkloud.xyz',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '인증번호',
    example: '000000',
  })
  @IsString()
  verificationCode!: string;
}
