import { Body, Controller, Post, ValidationPipe, Req, UseInterceptors, Get } from '@nestjs/common';
import { TransactionManager } from 'src/core/decorators/transaction.decorator';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { TransactionInterceptor } from 'src/core/interceptors/transaction.interceptor';
import { CloudService } from 'src/modules/cloud/cloud.service';
import { CreateCloudDto } from 'src/modules/cloud/dto/cloud.dto';
import { QueryRunner } from 'typeorm';

@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Post('')
  @UseInterceptors(TransactionInterceptor)
  async createCloud(
    @Body(ValidationPipe) body: CreateCloudDto,
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

  @Get('/list')
  async getClouds(@Req() request: RequestWithUser) {
    const user = request.user;
    const clouds = await this.cloudService.getClouds(user);

    return {
      count: clouds.length,
      clouds,
    };
  }
}
