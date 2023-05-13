import { Body, Controller, Post, ValidationPipe, Req } from '@nestjs/common';
import { RequestWithUser } from 'src/core/http/types/http-request.type';
import { CloudService } from 'src/modules/cloud/cloud.service';
import { CreateCloudDto } from 'src/modules/cloud/dto/cloud.dto';

@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Post('')
  async createCloud(@Body(ValidationPipe) body: CreateCloudDto, @Req() request: RequestWithUser) {
    const user = request.user;
    const cloud = await this.cloudService.createCloud(body, user);

    return { id: cloud.id, name: cloud.name };
  }
}
