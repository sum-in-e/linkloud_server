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
      .andWhere('cloud.userId = :userId', { userId: user.id })
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
}
