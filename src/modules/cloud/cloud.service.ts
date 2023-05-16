import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { User } from 'src/modules/user/entities/user.entity';
import { CreateCloudDto } from 'src/modules/cloud/dto/cloud.dto';
import { QueryRunner } from 'typeorm';

@Injectable()
export class CloudService {
  constructor(private readonly cloudRepository: CloudRepository) {}
  async createCloud(body: CreateCloudDto, user: User, queryRunner: QueryRunner): Promise<Cloud> {
    try {
      await this.cloudRepository.incrementPositionOfUserClouds(user, queryRunner); // 유저가 가진 클라우드의 cloud.order에 전부 +1
      return await this.cloudRepository.createCloud(body.name, user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 생성 실패', { status: 500 });
    }
  }
}
