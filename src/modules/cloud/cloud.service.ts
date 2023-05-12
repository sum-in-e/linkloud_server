import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class CloudService {
  constructor(private readonly cloudRepository: CloudRepository) {}

  /**
   * @description '미분류' 클라우드 생성하는 메서드
   */
  async createDefaultCloudForUser(user: User, queryRunner: QueryRunner): Promise<Cloud> {
    try {
      return await this.cloudRepository.createUncategorizedCloud(user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.SIGN_UP_FAILED, '클라우드 생성 실패');
    }
  }
}
