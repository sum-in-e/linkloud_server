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

  async findCloudByIdAndUser(id: number, userId: number): Promise<Cloud | null> {
    return this.cloudRepository
      .createQueryBuilder('cloud')
      .where('cloud.id = :id', { id })
      .andWhere('cloud.user = :userId', { userId: userId })
      .getOne();
  }

  async createCloud(name: string, user: User): Promise<Cloud> {
    const cloud = new Cloud();
    cloud.name = name;
    cloud.user = user;
    return await this.cloudRepository.save(cloud);
  }
}
