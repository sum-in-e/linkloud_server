import { IsString, IsUrl, IsNumber, MinLength, IsOptional, IsBoolean, IsArray, IsNotEmpty } from 'class-validator';
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
  @IsOptional()
  cloudId!: number | null;
}

export class UpdateLinkDto {
  @ApiProperty({ description: '링크의 URL' })
  @IsUrl()
  @IsOptional()
  url!: string;

  @ApiProperty({ description: '링크의 제목' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  title!: string;

  @ApiProperty({ description: '링크의 설명' })
  @IsString()
  @IsOptional()
  description!: string;

  @ApiProperty({ description: '링크에 대한 메모' })
  @IsString()
  @IsOptional()
  memo!: string;

  @ApiProperty({ description: '내 컬렉션 저장 여부' })
  @IsBoolean()
  @IsOptional()
  isInMyCollection!: boolean;

  @ApiProperty({ description: '클라우드 ID' })
  @IsNumber()
  @IsOptional()
  cloudId!: number | null;
}

export class DeleteLinksDto {
  @IsArray()
  @IsNumber({}, { each: true })
  linkIds!: number[];
}
