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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsPublic } from 'src/core/auth/decorator/is-public.decorator';
import { TransactionManager } from 'src/core/tansaction/decorators/transaction.decorator';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { TransactionInterceptor } from 'src/core/tansaction/interceptors/transaction.interceptor';
import {
  CreateLinkDto,
  DeleteLinksDto,
  GetAnalyzeDto,
  GetLinksDto,
  UpdateLinkDto,
  UpdateLinksKloudDto,
} from 'src/modules/link/dto/link.dto';
import { LinkAnalyzeService } from 'src/modules/link/link-analyze.service';
import { LinkService } from 'src/modules/link/link.service';
import { UpdateLinkPipe } from 'src/modules/link/pipes/update-link.pipe';
import { QueryRunner } from 'typeorm';

@ApiTags('링크 APIs')
@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService, private readonly linkAnalyzeService: LinkAnalyzeService) {}

  @ApiOperation({ summary: '메타태그 기반 링크 데이터 추출' })
  @ApiResponse({ status: 400, description: ResponseCode.INVALID_URL })
  @Post('analyze')
  @IsPublic()
  async getAnalyze(@Query() query: GetAnalyzeDto) {
    return await this.linkAnalyzeService.linkAnalyze(query.url);
  }

  @ApiOperation({ summary: '링크 추가' })
  @ApiResponse({ status: 400, description: ResponseCode.INVALID_PARAMS })
  @ApiResponse({ status: 404, description: ResponseCode.KLOUD_NOT_FOUND })
  @Post('')
  async createLink(@Body(ValidationPipe) body: CreateLinkDto, @Req() request: RequestWithUser) {
    // url, title은 필수라서 유저가 보낸 데이터를 검증해야하겠지만 클라이언트에서 title 없으면 저장 못 하게 할거고, url은 애초에 linkAnalyze api에서 내려주는거 그대로 가져오는거라 유저가 수정 못 하는 값이라 에러가 나면 뭔가 이상하게 동작하는 것임. 그래서 굳이 특정 property 지정할 필요 없이 전부 BadRequestError 주면 되서 그냥 validationPipe를 사용함
    const user = request.user;
    const link = await this.linkService.createLink(body, user);

    return {
      kloudId: link.kloud ? link.kloud.id : null, // null이면 분류 안 된 링크
    };
  }

  @ApiOperation({
    summary: '링크 리스트 조회(+검색)',
    description: 'limit, offset 외 아무 쿼리도 보내지 않으면 전체 조회',
  })
  @Get('list')
  async getLinks(@Req() request: RequestWithUser, @Query(new ValidationPipe({ transform: true })) query: GetLinksDto) {
    const user = request.user;

    const { linkCount, links } = await this.linkService.getLinks(user, query);

    return {
      count: linkCount,
      links: links.map((link) => ({
        id: link.id,
        url: link.url,
        thumbnailUrl: link.thumbnailUrl,
        title: link.title,
        description: link.description,
        memo: link.memo,
        isInMyCollection: link.isInMyCollection,
        isRead: link.isRead,
        clickCount: link.clickCount,
        clickFrequency: link.clickFrequency,
        lastClickedAt: link.lastClickedAt,
        createdAt: link.createdAt,
        kloud: link.kloud
          ? {
              id: link.kloud.id,
              name: link.kloud.name,
            }
          : null,
      })),
    };
  }

  @ApiOperation({ summary: '링크 상세 정보 조회' })
  @ApiResponse({ status: 404, description: ResponseCode.LINK_NOT_FOUND })
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
      isRead: link.isRead,
      clickCount: link.clickCount,
      clickFrequency: link.clickFrequency,
      lastClickedAt: link.lastClickedAt,
      createdAt: link.createdAt,
      kloud: link.kloud
        ? {
            id: link.kloud.id,
            name: link.kloud.name,
          }
        : null,
    };

    return response;
  }

  @ApiOperation({ summary: '링크 클릭 횟수 카운팅' })
  @ApiResponse({ status: 404, description: ResponseCode.LINK_NOT_FOUND })
  @Patch(':id/click-count')
  async addLinkCount(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithUser) {
    const user = request.user;
    await this.linkService.addLinkCount(id, user);
    return {};
  }

  @ApiOperation({ summary: '선택한 링크의 클라우드 일괄 이동' })
  @ApiResponse({ status: 400, description: ResponseCode.INVALID_PARAMS })
  @ApiResponse({ status: 404, description: `${ResponseCode.LINK_NOT_FOUND}, ${ResponseCode.KLOUD_NOT_FOUND}` })
  @Patch('ids/kloud')
  @UseInterceptors(TransactionInterceptor)
  async updateLinksKloud(
    @Body(ValidationPipe) body: UpdateLinksKloudDto,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    await this.linkService.updateLinksKloud(body.linkIds, body.kloudId, user, queryRunner);
    return {};
  }

  @ApiOperation({ summary: '선택한 링크 일괄 제거' })
  @ApiResponse({ status: 404, description: ResponseCode.LINK_NOT_FOUND })
  @Post('ids/delete') // 일반적으로 POST 메서드는 리소스를 생성하는 데 사용되지만 body를 받을 수 없기 때문에 다수의 아이템을 삭제하는 경우는 이렇게 예외적으로 사용한다.
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
  @ApiResponse({ status: 400, description: ResponseCode.INVALID_PARAMS })
  @ApiResponse({ status: 404, description: `${ResponseCode.LINK_NOT_FOUND}, ${ResponseCode.KLOUD_NOT_FOUND}` })
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
      isRead: updatedLink.isRead,
      clickCount: updatedLink.clickCount,
      clickFrequency: updatedLink.clickFrequency,
      lastClickedAt: updatedLink.lastClickedAt,
      createdAt: updatedLink.createdAt,
      kloud: updatedLink.kloud
        ? {
            id: updatedLink.kloud.id,
            name: updatedLink.kloud.name,
          }
        : null,
    };

    return response;
  }

  @ApiOperation({ summary: '링크 제거' })
  @ApiResponse({ status: 404, description: ResponseCode.LINK_NOT_FOUND })
  @Delete(':id')
  async deleteLink(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithUser) {
    const user = request.user;

    await this.linkService.deleteLinkById(id, user);

    return {};
  }
}
