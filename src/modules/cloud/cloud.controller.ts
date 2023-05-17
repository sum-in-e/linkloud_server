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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionManager } from 'src/core/decorators/transaction.decorator';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { TransactionInterceptor } from 'src/core/interceptors/transaction.interceptor';
import { CloudService } from 'src/modules/cloud/cloud.service';
import { CloudNameDto, UpdateCloudPositionDto } from 'src/modules/cloud/dto/cloud.dto';
import { QueryRunner } from 'typeorm';
@ApiTags('클라우드 APIs')
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @ApiOperation({ summary: '클라우드 생성' })
  @Post('')
  @UseInterceptors(TransactionInterceptor)
  async createCloud(
    @Body(ValidationPipe) body: CloudNameDto,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    const cloud = await this.cloudService.createCloud(body, user, queryRunner);

    return {
      id: cloud.id,
      name: cloud.name,
    };
  }

  @ApiOperation({ summary: '로그인한 유저의 클라우드 리스트 조회' })
  @Get('/list')
  async getClouds(@Req() request: RequestWithUser) {
    const user = request.user;
    const clouds = await this.cloudService.getClouds(user);

    return {
      count: clouds.length,
      clouds,
    };
  }

  @ApiOperation({ summary: '클라우드 순서 변경' })
  @Patch('/position/:id')
  @UseInterceptors(TransactionInterceptor)
  async updateCloudPosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCloudPositionDto,
    @Req() request: RequestWithUser,
    @TransactionManager() queryRunner: QueryRunner,
  ) {
    const user = request.user;
    await this.cloudService.updateCloudPosition(id, body.newPosition, user, queryRunner);

    return {};
  }

  @ApiOperation({ summary: '클라우드 수정' })
  @Patch('/:id')
  async updateCloud(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) body: CloudNameDto,
    @Req() request: RequestWithUser,
  ) {
    const user = request.user;
    const cloud = await this.cloudService.updateCloud(id, body, user);

    return {
      id: cloud.id,
      name: cloud.name,
    };
  }

  @ApiOperation({ summary: '클라우드 제거' })
  @Delete('/:id')
  async deleteCloud(@Param('id', ParseIntPipe) id: number, @Req() request: RequestWithUser) {
    const user = request.user;
    await this.cloudService.deleteCloud(id, user);

    return {};
  }
}
