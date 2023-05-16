import { Body, Controller, Get, Post, Query, Req, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { CreateLinkDto } from 'src/modules/link/dto/link.dto';
import { LinkAnalyzeService } from 'src/modules/link/link-analyze.service';
import { LinkService } from 'src/modules/link/link.service';

@ApiTags('링크 APIs')
@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService, private readonly linkAnalyzeService: LinkAnalyzeService) {}

  @ApiOperation({ summary: '메타태그 기반 링크 데이터 추출' })
  @Get('analyze')
  @IsPublic()
  async analyze(@Query('url') url: string) {
    return await this.linkAnalyzeService.linkAnalyze(url);
  }

  @ApiOperation({ summary: '링크 추가' })
  @Post('')
  async createLink(@Body(ValidationPipe) body: CreateLinkDto, @Req() request: RequestWithUser) {
    // url, title은 필수라서 유저가 보낸 데이터를 검증해야하겠지만 클라이언트에서 title 없으면 저장 못 하게 할거고, url은 애초에 linkAnalyze api에서 내려주는거 그대로 가져오는거라 유저가 수정 못 하는 값이라 에러가 나면 뭔가 이상하게 동작하는 것임. 그래서 굳이 특정 property 지정할 필요 없이 전부 BadRequestError 주면 되서 그냥 validationPipe를 사용함
    const user = request.user;
    const link = await this.linkService.createLink(body, user);

    return {
      cloudId: link.cloud ? link.cloud.id : null, // null이면 분류 안 된 링크
    };
  }
}
