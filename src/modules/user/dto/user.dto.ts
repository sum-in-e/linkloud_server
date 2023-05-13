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
    description: '비밀번호 -영문, 숫자, 특수문자를 모두 포함하는 8~15자 조합',
  })
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])[\da-zA-Z\W_]{8,15}$/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함하는 8~15자 조합이어야 합니다.',
  })
  password!: string;

  @ApiProperty({
    description: '유저명(닉네임) - 2~15자',
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
    description:
      '이름은 sign인데 값은 sub(카카오 서버로부터 받은 id_token에 있는 sub -> 카카오 유저 아이디)이다. sub이라고 노출하면 안 될 것 같아서 sign으로 받음',
  })
  @IsString()
  sign!: string;

  @ApiProperty({
    description: '유저명(닉네임) - 2~15자',
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

export class LoginDto {
  @ApiProperty({
    description: '이메일',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '비밀번호',
  })
  @IsString()
  password!: string;
}
