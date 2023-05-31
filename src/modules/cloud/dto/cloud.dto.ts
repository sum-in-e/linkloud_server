import { IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloudNameDto {
  @ApiProperty({ description: '클라우드 이름' }) // 💡ApiProperty 생성 안 하면 swagger에 dto에 해당하는 body 등 생성 안 됨
  @IsString()
  @MaxLength(50)
  @MinLength(1)
  name!: string;
}

export class UpdateCloudPositionDto {
  @ApiProperty({ description: '변경할 position' })
  @IsNumber()
  @IsNotEmpty()
  newPosition!: number;
}
