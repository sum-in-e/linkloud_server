import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { User } from 'src/modules/user/entities/user.entity';
import { CloudNameDto } from 'src/modules/cloud/dto/cloud.dto';
import { QueryRunner } from 'typeorm';

@Injectable()
export class CloudService {
  constructor(private readonly cloudRepository: CloudRepository) {}
  async createCloud(body: CloudNameDto, user: User, queryRunner: QueryRunner): Promise<Cloud> {
    const userCloudCount = await this.cloudRepository.countUserClouds(user, queryRunner);

    if (userCloudCount >= 20) {
      throw new CustomHttpException(
        ResponseCode.CREATE_CLOUD_MAXIMUM_20,
        '클라우드는 유저당 20개 까지 생성 가능합니다',
      );
    }

    try {
      if (userCloudCount > 0) {
        await this.cloudRepository.incrementPositionOfUserClouds(user, queryRunner);
      }
      return await this.cloudRepository.createCloud(body.name, user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 생성 실패', { status: 500 });
    }
  }

  async getClouds(user: User): Promise<Pick<Cloud, 'id' | 'name'>[] | []> {
    try {
      return await this.cloudRepository.getClouds(user);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 조회 실패', { status: 500 });
    }
  }

  async updateCloudPosition(id: number, newPosition: number, user: User, queryRunner: QueryRunner): Promise<void> {
    if (!newPosition) {
      throw new CustomHttpException(
        ResponseCode.INVALID_NEW_POSITION,
        '변경할 position이 올바르게 전달되지 않았습니다.',
      );
    }

    const cloud = await this.cloudRepository.findCloudByIdAndUserWithTransaction(id, user, queryRunner);

    if (!cloud) {
      throw new CustomHttpException(ResponseCode.CLOUD_NOT_FOUND, '클라우드를 찾을 수 없습니다');
    }

    const prevPosition = cloud.position;

    if (prevPosition === newPosition) {
      return; // 수정한 위치와 클라우드의 기존 위치가 동일하면 로직 종료
    }

    try {
      await this.cloudRepository.updateCloudPosition(cloud, newPosition, queryRunner); // 선택한 클라우드의 위치를 수정
      await this.cloudRepository.updateOtherCloudsPosition(prevPosition, newPosition, id, user, queryRunner); // 클라우드 위치 변경에 영향 받는 클라우드들의 Position 수정
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 순서 변경 실패', { status: 500 });
    }
  }

  async updateCloud(id: number, body: CloudNameDto, user: User): Promise<Cloud> {
    const cloud = await this.cloudRepository.findCloudByIdAndUser(id, user);

    if (!cloud) {
      throw new CustomHttpException(ResponseCode.CLOUD_NOT_FOUND, '클라우드를 찾을 수 없습니다');
    }

    try {
      return await this.cloudRepository.updateCloud(body, cloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 수정 실패', { status: 500 });
    }
  }
}
