import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCloudDto {
  @ApiProperty({ description: '클라우드 이름' })
  @IsString()
  @MaxLength(50)
  @MinLength(1)
  name!: string;
}
