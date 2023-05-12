import { IsString, IsUrl, IsNumber, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({ description: '링크의 URL' })
  @IsUrl()
  url!: string;

  @ApiProperty({ description: '링크의 썸네일 URL' })
  @IsUrl()
  @IsOptional()
  thumbnailUrl!: string | null;

  @ApiProperty({ description: '링크의 제목' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: '링크의 설명' })
  @IsString()
  description!: string;

  @ApiProperty({ description: '클라우드 ID' })
  @IsNumber()
  cloudId!: number;
}
