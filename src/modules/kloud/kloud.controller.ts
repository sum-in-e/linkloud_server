import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  Req,
  UseInterceptors,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionManager } from 'src/core/tansaction/decorators/transaction.decorator';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { TransactionInterceptor } from 'src/core/tansaction/interceptors/transaction.interceptor';
import { KloudService } from 'src/modules/kloud/kloud.service';
import { KloudNameDto, UpdateKloudPositionDto } from 'src/modules/kloud/dto/kloud.dto';
import { QueryRunner } from 'typeorm';
@ApiTags('클라우드 APIs')
@Controller('kloud')
export class KloudController {
  constructor(private readonly kloudService: KloudService) {}

  @ApiOperation({ summary: '클라우드 생성' })
  @ApiResponse({ status: 400, description: ResponseCode.CREATE_KLOUD_MAXIMUM_20 })
  @Post('')
  async createKloud(@Body(ValidationPipe) body: KloudNameDto, @Req() request: RequestWithUser) {
    const user = request.user;
    const kloud = await this.kloudService.createKloud(body, user);

    return {
      id: kloud.id,
      name: kloud.name,
    };
  }

  @ApiOperation({ summary: '클라우드 리스트 조회' })
  @Get('list')
  async getKlouds(@Req() request: RequestWithUser) {
    const user = request.user;
    const klouds = await this.kloudService.getKlouds(user);

    return {
      count: klouds.length,
      klouds,
    };
  }

  @ApiOperation({ summary: '클라우드 개별 조회' })
  @ApiResponse({ status: 404, description: ResponseCode.KLOUD_NOT_FOUND })
  @Get(':id')
  async getKloud(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithUser) {
    const user = request.user;
    return await this.kloudService.getKloudByIdAndUser(id, user);
  }

  @ApiOperation({ summary: '클라우드 순서 변경' })
  @ApiResponse({ status: 400, description: ResponseCode.INVALID_NEW_POSITION })
  @ApiResponse({ status: 404, description: ResponseCode.KLOUD_NOT_FOUND })
  @Patch('position/:id')
  @UseInterceptors(TransactionInterceptor)
  async updateKloudPosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateKloudPositionDto,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    await this.kloudService.updateKloudPosition(id, body.newPosition, user, queryRunner);

    return {};
  }

  @ApiOperation({ summary: '클라우드 수정' })
  @ApiResponse({ status: 404, description: ResponseCode.KLOUD_NOT_FOUND })
  @Patch(':id')
  async updateKloud(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) body: KloudNameDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    const kloud = await this.kloudService.updateKloud(id, body, user);

    return {
      id: kloud.id,
      name: kloud.name,
    };
  }

  @ApiOperation({ summary: '클라우드 제거' })
  @ApiResponse({ status: 404, description: ResponseCode.KLOUD_NOT_FOUND })
  @Delete(':id')
  @UseInterceptors(TransactionInterceptor)
  async deleteKloud(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    await this.kloudService.deleteKloud(id, user, queryRunner);

    return {};
  }
}
