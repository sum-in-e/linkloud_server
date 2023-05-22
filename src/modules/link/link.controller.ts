import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';
import { TransactionManager } from 'src/core/decorators/transaction.decorator';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { TransactionInterceptor } from 'src/core/interceptors/transaction.interceptor';
import { CreateLinkDto, DeleteLinksDto, UpdateLinkDto, UpdateLinksCloudDto } from 'src/modules/link/dto/link.dto';
import { LinkAnalyzeService } from 'src/modules/link/link-analyze.service';
import { LinkService } from 'src/modules/link/link.service';
import { UpdateLinkPipe } from 'src/modules/link/pipes/update-link.pipe';
import { QueryRunner } from 'typeorm';

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

  @ApiOperation({ summary: '내 컬렉션에 등록된 링크 개수 조회' })
  @Get('count/my-collection')
  async getLinkCountInMyCollection(@Req() request: RequestWithUser) {
    const user = request.user;
    const count = await this.linkService.getLinkCountInMyCollection(user);

    return {
      count,
    };
  }

  @ApiOperation({ summary: '링크 상세 정보 조회' })
  @Get(':id')
  async getLinkDetail(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithUser) {
    const user = request.user;
    const link = await this.linkService.getLinkDetail(id, user);

    const response = {
      id: link.id,
      url: link.url,
      thumbnailUrl: link.thumbnailUrl,
      title: link.title,
      description: link.description,
      memo: link.memo,
      isInMyCollection: link.isInMyCollection,
      createdAt: link.createdAt,
      cloud: link.cloud
        ? {
            id: link.cloud.id,
            name: link.cloud.name,
          }
        : null,
    };

    return response;
  }

  @ApiOperation({ summary: '선택한 링크의 클라우드 일괄 이동' })
  @Patch('ids/cloud')
  @UseInterceptors(TransactionInterceptor)
  async updateLinksCloud(
    @Body(ValidationPipe) body: UpdateLinksCloudDto,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    await this.linkService.updateLinksCloud(body.linkIds, body.cloudId, user, queryRunner);
    return {};
  }

  @ApiOperation({ summary: '선택한 링크 일괄 제거' })
  @Delete('ids/delete')
  @UseInterceptors(TransactionInterceptor)
  async deleteLinks(
    @Body(ValidationPipe) body: DeleteLinksDto,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    await this.linkService.deleteLinks(body.linkIds, user, queryRunner);

    return {};
  }

  @ApiOperation({ summary: '링크 정보 수정' })
  @Patch(':id')
  async updateLink(
    @Param('id', ParseIntPipe) id: number,
    @Body(UpdateLinkPipe) body: UpdateLinkDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;

    const updatedLink = await this.linkService.updateLink(id, body, user);

    const response = {
      id: updatedLink.id,
      url: updatedLink.url,
      thumbnailUrl: updatedLink.thumbnailUrl,
      title: updatedLink.title,
      description: updatedLink.description,
      memo: updatedLink.memo,
      isInMyCollection: updatedLink.isInMyCollection,
      createdAt: updatedLink.createdAt,
      cloud: updatedLink.cloud
        ? {
            id: updatedLink.cloud.id,
            name: updatedLink.cloud.name,
          }
        : null,
    };

    return response;
  }

  @ApiOperation({ summary: '링크 제거' })
  @Delete(':id')
  async deleteLink(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithUser) {
    const user = request.user;

    await this.linkService.deleteLinkById(id, user);

    return {};
  }
}
