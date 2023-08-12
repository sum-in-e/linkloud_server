import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { KloudNameDto } from 'src/modules/kloud/dto/kloud.dto';

@Injectable()
export class KloudRepository {
  constructor(
    @InjectRepository(Kloud)
    private kloudRepository: Repository<Kloud>,
  ) {}

  async findKloudByIdAndUser(id: number, user: User): Promise<Kloud | null> {
    return this.kloudRepository
      .createQueryBuilder('kloud')
      .where('kloud.id = :id', { id })
      .andWhere('kloud.user.id = :userId', { userId: user.id }) // 💡일반 where 메서드에서는 왜래키 컬럼 지정 시 kloud.user와 같이 관계 이름을 사용해서 지정한다.
      .getOne();
  }

  async findKloudByIdAndUserWithTransaction(id: number, user: User, queryRunner: QueryRunner): Promise<Kloud | null> {
    return queryRunner.manager
      .createQueryBuilder(Kloud, 'kloud')
      .where('kloud.id = :id', { id })
      .andWhere('kloud.user.id = :userId', { userId: user.id })
      .getOne();
  }

  /**
   * @description 유저가 소유한 클라우드를 조회합니다.
   */
  async findKloudByUser(user: User, queryRunner: QueryRunner): Promise<Kloud[] | []> {
    return await queryRunner.manager
      .createQueryBuilder(Kloud, 'kloud')
      .where('kloud.user.id = :userId', { userId: user.id })
      .getMany();
  }

  /**
   * @description 유저가 소유한 클라우드의 개수를 조회합니다.
   */
  async countUserKlouds(user: User): Promise<number> {
    return await this.kloudRepository
      .createQueryBuilder('kloud')
      .where('kloud.user.id = :userId', { userId: user.id })
      .getCount();
  }

  /**
   * @description 유저가 소유한 클라우드의 개수를 조회합니다. (트랜잭션)
   */
  async countUserKloudsWithTransaction(user: User, queryRunner: QueryRunner): Promise<number> {
    return await queryRunner.manager
      .createQueryBuilder(Kloud, 'kloud')
      .where('kloud.user.id = :userId', { userId: user.id })
      .getCount();
  }

  /**
   * @description 유저가 소유한 클라우드 중 position이 가장 큰 클라우드를 조회합니다
   */
  async findMaxPositionKloud(user: User): Promise<Kloud | null> {
    return await this.kloudRepository
      .createQueryBuilder('kloud')
      .where('kloud.user.id = :userId', { userId: user.id })
      .orderBy('kloud.position', 'DESC')
      .getOne();
  }

  /**
   * @description 클라우드를 생성합니다.
   */
  async createKloud(name: string, user: User, maxPositionKloud: Kloud | null): Promise<Kloud> {
    const kloud = new Kloud();
    kloud.position = maxPositionKloud !== null ? maxPositionKloud.position + 1 : 0;
    kloud.name = name;
    kloud.user = user;
    return await this.kloudRepository.save(kloud);
  }

  /**
   * @description 로그인한 유저가 소유한 클라우드를 position 기준으로 조회합니다. (position = 유저가 지정한 순서를 인식하기 위한 컬럼)
   */
  async getKlouds(user: User): Promise<Kloud[] | []> {
    return this.kloudRepository
      .createQueryBuilder('kloud')
      .loadRelationCountAndMap('kloud.linkCount', 'kloud.links') // 클라우드에 연결된 링크의 개수를 로드하고, linkCount 속성에 매핑
      .loadRelationCountAndMap('kloud.unreadLinkCount', 'kloud.links', 'unreadLink', (qb) =>
        qb.where('unreadLink.isRead = :isRead', { isRead: false }),
      ) // 클라우드에 연결된 링크 중 읽지 않은 링크의 개수를 로드하고, unreadLinkCount 속성에 매핑
      .select(['kloud.id', 'kloud.name', 'kloud.position'])
      .where('kloud.user.id = :userId', { userId: user.id })
      .orderBy('kloud.position', 'DESC')
      .getMany();
  }

  /**
   * @description id에 해당하는 클라우드를 조회하고 연결된 링크 개수를 함께 반환합니다.
   */
  async getKloudById(id: number, user: User): Promise<Kloud | null> {
    return this.kloudRepository
      .createQueryBuilder('kloud')
      .loadRelationCountAndMap('kloud.linkCount', 'kloud.links') // 클라우드에 연결된 링크의 개수를 로드하고, linkCount 속성에 매핑
      .select(['kloud.id', 'kloud.name'])
      .where('kloud.user.id = :userId', { userId: user.id })
      .andWhere('kloud.id = :id', { id })
      .getOne();
  }

  /**
   * @description [클라우드 순서 변경] 유저가 선택한 클라우드의 position 필드를 새로운 위치로 업데이트합니다.
   */
  async updateKloudPosition(kloud: Kloud, newPostion: number, queryRunner: QueryRunner): Promise<void> {
    kloud.position = newPostion;
    await queryRunner.manager.save(kloud);
  }

  /**
   * @description [클라우드 순서 변경] 변경된 클라우드로 인해 position에 영향을 받는 클라우드들의 position을 업데이트합니다.
   * 클라우드의 Position들이 연속적이라는 가정하에 만들어진 로직으로 position이 연속되지 않으면 사이드 이펙트가 발생할 수 있습니다.
   * 따라서 클라우드 추가 및 삭제 메서드에서도 클라우드 position에 변화를 주어 position의 값이 연속적일 수 있도록 로직을 설정한 상태입니다.
   */
  async updateOtherKloudsPosition(
    prevPosition: number,
    newPosition: number,
    id: number,
    user: User,
    queryRunner: QueryRunner,
  ): Promise<void> {
    // +1을 해야하는 경우 (클라우드가 더 높은 position에서 더 낮은 position으로 이동하는 경우, prevPosition과 newPosition 사이의 모든 클라우드들의 위치는 1씩 증가)
    if (prevPosition > newPosition) {
      await queryRunner.manager
        .createQueryBuilder(Kloud, 'kloud')
        .update()
        .set({ position: () => 'kloud.position + 1' })
        .where('kloud.user_id = :userId', { userId: user.id })
        .andWhere('kloud.id != :id', { id })
        .andWhere('kloud.position >= :newPosition', { newPosition: newPosition })
        .andWhere('kloud.position < :prevPosition', { prevPosition: prevPosition })
        .execute();
    }

    // -1을 해야하는 경우 (클라우드가 더 낮은 position에서 더 높은 position으로 이동하는 경우, prevPosition과 newPosition 사이의 모든 클라우드들의 위치는 1씩 감소)
    if (prevPosition < newPosition) {
      await queryRunner.manager
        .createQueryBuilder(Kloud, 'kloud')
        .update()
        .set({ position: () => 'kloud.position - 1' })
        .where('kloud.user_id = :userId', { userId: user.id })
        .andWhere('kloud.id != :id', { id })
        .andWhere('kloud.position <= :newPosition', { newPosition: newPosition })
        .andWhere('kloud.position > :prevPosition', { prevPosition: prevPosition })
        .execute();
    }
  }

  /**
   * @description 클라우드를 수정합니다.
   */
  async updateKloud(body: KloudNameDto, kloud: Kloud): Promise<Kloud> {
    kloud.name = body.name;
    return await this.kloudRepository.save(kloud);
  }

  /**
   * @description 클라우드를 제거합니다.
   */
  async deleteKloud(kloud: Kloud, queryRunner: QueryRunner): Promise<Kloud> {
    return await queryRunner.manager.remove(kloud);
  }

  /**
   * @description 클라우드들을 제거합니다. (회원 탈퇴 시 유저가 소유한 클라우드들 제거하기 위한 용도)
   */
  async deleteKlouds(klouds: Kloud[], queryRunner: QueryRunner): Promise<Kloud[]> {
    return await queryRunner.manager.remove(klouds);
  }

  /**
   * @description 제거된 클라우드의 Position보다 높은 position을 소유한 클라우드의 Position을 1씩 낮춥니다. (유저가 소유한 클라우드들의 Position 연속성을 유지하기 위함)
   */
  async updateKloudsPositionAfterDeletion(user: User, deletedKloud: Kloud, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder(Kloud, 'kloud')
      .update()
      .set({ position: () => 'kloud.position - 1' })
      .where('kloud.user_id = :userId', { userId: user.id })
      .andWhere('kloud.position > :deletedPosition', { deletedPosition: deletedKloud.position })
      .execute();
  }
}
