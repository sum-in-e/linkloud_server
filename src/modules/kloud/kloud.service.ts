import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { KloudRepository } from 'src/modules/kloud/repository/kloud.repository';
import { User } from 'src/modules/user/entities/user.entity';
import { KloudNameDto } from 'src/modules/kloud/dto/kloud.dto';
import { QueryRunner } from 'typeorm';

@Injectable()
export class KloudService {
  constructor(private readonly kloudRepository: KloudRepository) {}
  async createKloud(body: KloudNameDto, user: User): Promise<Kloud> {
    if (body.name.length > 50 || body.name.length === 0) {
      throw new CustomHttpException(ResponseCode.KLOUD_NAME_MAXIMUM_50, '클라우드 이름은 1~50자 이내로 작성해 주세요.');
    }

    const userKloudCount = await this.kloudRepository.countUserKlouds(user);

    if (userKloudCount >= 20) {
      throw new CustomHttpException(
        ResponseCode.CREATE_KLOUD_MAXIMUM_20,
        '유저당 최대 20개의 클라우드까지 생성 가능합니다.',
      );
    }

    try {
      const maxPositionKloud = await this.kloudRepository.findMaxPositionKloud(user);
      return await this.kloudRepository.createKloud(body.name, user, maxPositionKloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 생성에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  async getKlouds(user: User): Promise<Pick<Kloud, 'id' | 'name'>[] | []> {
    try {
      return await this.kloudRepository.getKlouds(user);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 조회 실패', { status: 500 });
    }
  }

  async getKloudByIdAndUser(id: number, user: User): Promise<Kloud> {
    const kloud = await this.kloudRepository.getKloudWithLinkCount(id, user);

    if (!Kloud || kloud === null) {
      throw new CustomHttpException(ResponseCode.KLOUD_NOT_FOUND, '클라우드를 찾을 수 없습니다', { status: 404 });
    }

    return kloud;
  }

  async updateKloudPosition(id: number, newPosition: number, user: User, queryRunner: QueryRunner): Promise<void> {
    if (!newPosition) {
      throw new CustomHttpException(
        ResponseCode.INVALID_NEW_POSITION,
        '변경할 position이 올바르게 전달되지 않았습니다.',
      );
    }

    const kloud = await this.kloudRepository.findKloudByIdAndUserWithTransaction(id, user, queryRunner);

    if (!kloud || kloud === null) {
      throw new CustomHttpException(ResponseCode.KLOUD_NOT_FOUND, '클라우드를 찾을 수 없습니다', { status: 404 });
    }

    const userKloudCount = await this.kloudRepository.countUserKloudsWithTransaction(user, queryRunner);
    if (newPosition < 0 || newPosition >= userKloudCount) {
      // 새위치가 음수로 오거나, 가지고 있는 클라우드의 수 이상으로 들어오면 position 사이에 공백이 생기면서 연속성이 깨지므로 이에 대한 예외 처리
      throw new CustomHttpException(ResponseCode.INVALID_NEW_POSITION, '새로운 위치가 유효하지 않습니다');
    }

    const prevPosition = kloud.position;
    if (prevPosition === newPosition) {
      // 수정한 위치와 클라우드의 기존 위치가 동일하면 로직 종료
      return;
    }

    try {
      await this.kloudRepository.updateKloudPosition(kloud, newPosition, queryRunner); // 선택한 클라우드의 위치를 수정
      await this.kloudRepository.updateOtherKloudsPosition(prevPosition, newPosition, id, user, queryRunner); // 위 클라우드 위치 변경에 영향 받는 클라우드들의 Position 수정
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 순서 변경 실패', { status: 500 });
    }
  }

  async updateKloud(id: number, body: KloudNameDto, user: User): Promise<Kloud> {
    const kloud = await this.kloudRepository.findKloudByIdAndUser(id, user);

    if (!kloud || kloud === null) {
      throw new CustomHttpException(ResponseCode.KLOUD_NOT_FOUND, '클라우드를 찾을 수 없습니다', { status: 404 });
    }

    try {
      return await this.kloudRepository.updateKloud(body, kloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 수정 실패', { status: 500 });
    }
  }

  async deleteKloud(id: number, user: User, queryRunner: QueryRunner): Promise<void> {
    const kloud = await this.kloudRepository.findKloudByIdAndUserWithTransaction(id, user, queryRunner);

    if (!kloud || kloud === null) {
      throw new CustomHttpException(ResponseCode.KLOUD_NOT_FOUND, '클라우드를 찾을 수 없습니다', { status: 404 });
    }

    try {
      const deletedKloud = await this.kloudRepository.deleteKloud(kloud, queryRunner);
      await this.kloudRepository.updateKloudsPositionAfterDeletion(user, deletedKloud, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드 제거 실패', { status: 500 });
    }
  }
}
