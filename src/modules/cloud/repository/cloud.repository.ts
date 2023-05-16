import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';

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
      .andWhere('cloud.user = :userId', { userId: user.id })
      .getOne();
  }

  async createCloud(name: string, user: User, queryRunner: QueryRunner): Promise<Cloud> {
    const cloud = new Cloud();
    cloud.name = name;
    cloud.user = user;
    return await queryRunner.manager.save(cloud);
  }

  async incrementPositionOfUserClouds(user: User, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .update(Cloud)
      .set({
        position: () => '`position` + 1',
      })
      .where('user = :userId', { userId: user.id })
      .execute();
  }

  async countUserClouds(user: User, queryRunner: QueryRunner): Promise<number> {
    return await queryRunner.manager
      .createQueryBuilder(Cloud, 'cloud')
      .where('cloud.user = :userId', { userId: user.id })
      .getCount();
  }

  /**
   * @description 로그인한 유저가 소유한 클라우드를 position 기준으로 조회합니다. (position = 유저가 지정한 순서를 인식하기 위한 컬럼)
   */
  async getClouds(user: User): Promise<Cloud[]> {
    return this.cloudRepository
      .createQueryBuilder('cloud')
      .loadRelationCountAndMap('cloud.linkCount', 'cloud.links') // 클라우드에 연결된 링크의 개수를 로드하고, linkCount 속성에 매핑
      .select(['cloud.id', 'cloud.name'])
      .where('cloud.user = :userId', { userId: user.id })
      .orderBy('cloud.position', 'ASC')
      .getMany();
  }
}
