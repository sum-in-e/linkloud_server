import { IsBoolean, IsEmail, IsString, Matches, MaxLength, MinLength, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: '이메일',
    example: 'example@linkloud.co.kr',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '비밀번호 / 영문, 숫자, 특수문자 중 최소 두 가지 조합으로 8~15자',
  })
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[\da-zA-Z\W_]{8,15}$/, {
    message: '비밀번호는 영문, 숫자, 특수문자 중 최소 두 가지 조합으로 8~15자 이내여야 합니다.',
  })
  password!: string;

  @ApiProperty({
    description: '유저명(닉네임) / 2~15자',
  })
  @IsString()
  @MinLength(2, { message: '유저명은 최소 2자 이상이어야 합니다.' })
  @MaxLength(15, { message: '유저명은 최대 15자 이하여야 합니다.' })
  name!: string;

  @ApiProperty({
    description: '개인정보제공동의 여부',
  })
  @IsBoolean()
  @Equals(true)
  isAgreeProvidePersonalInfo!: boolean;

  @ApiProperty({
    description: '이용약관동의 여부',
  })
  @IsBoolean()
  @Equals(true)
  isAgreeTermsOfUse!: boolean;
}

export class KakaoSignUpDto {
  @ApiProperty({
    description: '이메일',
    example: 'example@linkloud.co.kr',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '유저명(닉네임) / 카카오에서 넘어오는 닉네임 그대로 이용',
  })
  @MinLength(2, { message: '유저명은 최소 2자 이상이어야 합니다.' })
  @MaxLength(15, { message: '유저명은 최대 15자 이하여야 합니다.' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: '개인정보제공동의 여부',
  })
  @IsBoolean()
  @Equals(true)
  isAgreeProvidePersonalInfo!: boolean;

  @ApiProperty({
    description: '이용약관동의 여부',
  })
  @IsBoolean()
  @Equals(true)
  isAgreeTermsOfUse!: boolean;
}
