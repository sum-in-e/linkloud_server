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
   * @description 클라우드를 생성합니다.
   */
  async createCloud(name: string, user: User, queryRunner: QueryRunner): Promise<Cloud> {
    const cloud = new Cloud();
    cloud.name = name;
    cloud.user = user;
    return await queryRunner.manager.save(cloud);
  }

  /**
   * @description 클라우드 생성 시 유저가 소유한 다른 클라우드들의 position을 1씩 증가시킵니다.
   */
  async incrementPositionOfUserClouds(user: User, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder(Cloud, 'cloud')
      .update()
      .set({
        position: () => 'cloud.position + 1',
      })
      .where('cloud.user_id = :userId', { userId: user.id }) // 💡Update() 메서드 사용 시 where절에서 외래키 컬럼은 외래키 컬럼의 컬럼명을 적어줘야한다. 그래서 user_id를 지정한다.
      .execute();
  }

  /**
   * @description 로그인한 유저가 소유한 클라우드의 개수를 조회합니다.
   */
  async countUserClouds(user: User, queryRunner: QueryRunner): Promise<number> {
    return await queryRunner.manager
      .createQueryBuilder(Cloud, 'cloud')
      .where('cloud.user = :userId', { userId: user.id })
      .getCount();
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
      .orderBy('cloud.position', 'ASC')
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
   */
  async updateOtherCloudsPosition(
    prevPosition: number,
    newPosition: number,
    id: number,
    user: User,
    queryRunner: QueryRunner,
  ): Promise<void> {
    // +1을 해야하는 경우 (클라우드가 더 높은 위치에서 더 낮은 위치로 이동하는 경우, 이전 위치와 새 위치 사이의 모든 클라우드들의 위치는 1씩 증가)
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

    // -1을 해야하는 경우 (클라우드가 더 낮은 위치에서 더 높은 위치로 이동하는 경우, 이전 위치와 새 위치 사이의 모든 클라우드들의 위치는 1씩 감소)
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
}
