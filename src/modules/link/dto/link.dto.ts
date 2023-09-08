import {
  IsString,
  IsUrl,
  IsNumber,
  MinLength,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsInt,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateLinkDto {
  @ApiProperty({ description: '링크의 URL' })
  @IsString()
  url!: string;

  @ApiProperty({ description: '링크의 썸네일 URL' })
  @IsString()
  @IsOptional()
  thumbnailUrl!: string;

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
  kloudId!: number | null;
}

export class UpdateLinkDto {
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
  @IsInt()
  @IsOptional()
  kloudId!: number | null;
}

export class DeleteLinksDto {
  @ApiProperty({ description: '삭제할 링크의 ID 배열' })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsInt({ each: true })
  linkIds!: number[];
}

export class UpdateLinksKloudDto {
  @ApiProperty({ description: '클라우드 이동처리할 ID 배열' })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsInt({ each: true })
  linkIds!: number[];

  @ApiProperty({ description: '클라우드 ID' })
  @IsNotEmpty()
  @IsInt()
  @IsOptional()
  kloudId!: number | null;
}

export class GetLinksDto {
  @ApiProperty({ description: '시작 위치', example: 10 })
  @IsInt()
  @Transform(({ value }) => Number(value)) //💡 @Transform은 값이 있으면 변환을 할뿐 기본값을 설정하는 것은 아니다. 변형 시키려면 ValidationPipe를 우측처럼 설정해야한다. -> new ValidationPipe({ transform: true })
  offset!: number;

  @ApiProperty({ description: '한 번에 가져올 링크의 수', example: 20 })
  @IsInt()
  @Transform(({ value }) => Number(value))
  limit!: number;

  @ApiProperty({ description: '생성일 기준 정렬 방식', required: false, default: 'DESC', example: 'ASC' })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sort: 'DESC' | 'ASC' = 'DESC';

  @ApiProperty({ description: '검색어', required: false, example: 'test' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '링크 확인 여부 필터', required: false, example: 'true' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : false))
  isChecked?: boolean;

  @ApiProperty({ description: '내 컬렉션 필터', required: false, example: 'true' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : false))
  myCollection?: boolean;

  @ApiProperty({
    description: '클라우드 필터 - 클라우드 미지정의 경우 0, 클라우드별로 찾고싶은 경우 클라우드 아이디',
    required: false,
    example: '0',
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  kloudId?: number;
}

export class GetAnalyzeDto {
  @ApiProperty({ description: 'URL', example: 'https://www.naver.com' })
  @IsString()
  url!: string;
}
