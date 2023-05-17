import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudNameDto } from 'src/modules/cloud/dto/cloud.dto';

@Injectable()
export class CloudRepository {
  constructor(
    @InjectRepository(Cloud)
    private cloudRepository: Repository<Cloud>,
  ) {}

  async findCloudByIdAndUser(id: number, user: User): Promise<Cloud | null> {
    return this.cloudRepository
      .createQueryBuilder('cloud')
      .where('cloud.id = :id', { id })
      .andWhere('cloud.user = :userId', { userId: user.id }) // 💡일반 where 메서드에서는 왜래키 컬럼 지정 시 cloud.user와 같이 관계 이름을 사용해서 지정한다.
      .getOne();
  }

  async findCloudByIdAndUserWithTransaction(id: number, user: User, queryRunner: QueryRunner): Promise<Cloud | null> {
    return queryRunner.manager
      .createQueryBuilder(Cloud, 'cloud')
      .where('cloud.id = :id', { id })
      .andWhere('cloud.user = :userId', { userId: user.id })
      .getOne();
  }

  /**
   * @description 로그인한 유저가 소유한 클라우드의 개수를 조회합니다.
   */
  async countUserClouds(user: User): Promise<number> {
    return await this.cloudRepository
      .createQueryBuilder('cloud')
      .where('cloud.user = :userId', { userId: user.id })
      .getCount();
  }

  /**
   * @description 유저가 소유한 클라우드 중 position이 가장 큰 클라우드를 조회합니다
   */
  async findMaxPositionCloud(user: User): Promise<Cloud | null> {
    return await this.cloudRepository
      .createQueryBuilder('cloud')
      .where('cloud.user = :userId', { userId: user.id })
      .orderBy('cloud.position', 'DESC')
      .getOne();
  }

  /**
   * @description 클라우드를 생성합니다.
   */
  async createCloud(name: string, user: User, maxPositionCloud: Cloud | null): Promise<Cloud> {
    const cloud = new Cloud();
    cloud.position = maxPositionCloud !== null ? maxPositionCloud.position + 1 : 0;
    cloud.name = name;
    cloud.user = user;
    return await this.cloudRepository.save(cloud);
  }

  /**
   * @description 로그인한 유저가 소유한 클라우드를 position 기준으로 조회합니다. (position = 유저가 지정한 순서를 인식하기 위한 컬럼)
   */
  async getClouds(user: User): Promise<Cloud[] | []> {
    return this.cloudRepository
      .createQueryBuilder('cloud')
      .loadRelationCountAndMap('cloud.linkCount', 'cloud.links') // 클라우드에 연결된 링크의 개수를 로드하고, linkCount 속성에 매핑
      .select(['cloud.id', 'cloud.name', 'cloud.position'])
      .where('cloud.user = :userId', { userId: user.id })
      .orderBy('cloud.position', 'DESC')
      .getMany();
  }

  /**
   * @description [클라우드 순서 변경] 유저가 선택한 클라우드의 position 필드를 새로운 위치로 업데이트합니다.
   */
  async updateCloudPosition(cloud: Cloud, newPostion: number, queryRunner: QueryRunner): Promise<void> {
    cloud.position = newPostion;
    await queryRunner.manager.save(cloud);
  }

  /**
   * @description [클라우드 순서 변경] 변경된 클라우드로 인해 position에 영향을 받는 클라우드들의 position을 업데이트합니다.
   * 클라우드의 Position들이 연속적이라는 가정하에 만들어진 로직으로 position이 연속되지 않으면 사이드 이펙트가 발생할 수 있습니다.
   * 따라서 클라우드 추가 및 삭제 메서드에서도 클라우드 position에 변화를 주어 position의 값이 연속적일 수 있도록 로직을 설정한 상태입니다.
   */
  async updateOtherCloudsPosition(
    prevPosition: number,
    newPosition: number,
    id: number,
    user: User,
    queryRunner: QueryRunner,
  ): Promise<void> {
    // +1을 해야하는 경우 (클라우드가 더 높은 position에서 더 낮은 position으로 이동하는 경우, prevPosition과 newPosition 사이의 모든 클라우드들의 위치는 1씩 증가)
    if (prevPosition > newPosition) {
      await queryRunner.manager
        .createQueryBuilder(Cloud, 'cloud')
        .update()
        .set({ position: () => 'cloud.position + 1' })
        .where('cloud.user_id = :userId', { userId: user.id })
        .andWhere('cloud.id != :id', { id })
        .andWhere('cloud.position >= :newPosition', { newPosition: newPosition })
        .andWhere('cloud.position < :prevPosition', { prevPosition: prevPosition })
        .execute();
    }

    // -1을 해야하는 경우 (클라우드가 더 낮은 position에서 더 높은 position으로 이동하는 경우, prevPosition과 newPosition 사이의 모든 클라우드들의 위치는 1씩 감소)
    if (prevPosition < newPosition) {
      await queryRunner.manager
        .createQueryBuilder(Cloud, 'cloud')
        .update()
        .set({ position: () => 'cloud.position - 1' })
        .where('cloud.user_id = :userId', { userId: user.id })
        .andWhere('cloud.id != :id', { id })
        .andWhere('cloud.position <= :newPosition', { newPosition: newPosition })
        .andWhere('cloud.position > :prevPosition', { prevPosition: prevPosition })
        .execute();
    }
  }

  /**
   * @description 클라우드를 수정합니다.
   */
  async updateCloud(body: CloudNameDto, cloud: Cloud): Promise<Cloud> {
    cloud.name = body.name;
    return await this.cloudRepository.save(cloud);
  }

  /**
   * @description 클라우드를 제거합니다.
   */
  async deleteCloud(cloud: Cloud, queryRunner: QueryRunner): Promise<Cloud> {
    return await queryRunner.manager.remove(cloud);
  }

  /**
   * @description 제거된 클라우드의 Position보다 높은 position을 소유한 클라우드의 Position을 1씩 낮춥니다. (유저가 소유한 클라우드들의 Position 연속성을 유지하기 위함)
   */
  async updateCloudsPositionAfterDeletion(user: User, deletedCloud: Cloud, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder(Cloud, 'cloud')
      .update()
      .set({ position: () => 'cloud.position - 1' })
      .where('cloud.user_id = :userId', { userId: user.id })
      .andWhere('cloud.position > :deletedPosition', { deletedPosition: deletedCloud.position })
      .execute();
  }
}
