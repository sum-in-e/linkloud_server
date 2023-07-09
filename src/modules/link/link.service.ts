import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { KloudRepository } from 'src/modules/kloud/repository/kloud.repository';
import { CreateLinkDto, GetLinksDto, UpdateLinkDto } from 'src/modules/link/dto/link.dto';
import { Link } from 'src/modules/link/entities/link.entity';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';
import { User } from 'src/modules/user/entities/user.entity';
import { QueryRunner } from 'typeorm';

@Injectable()
export class LinkService {
  constructor(private readonly linkRepository: LinkRepository, private readonly kloudRepository: KloudRepository) {}

  async createGuideLinks(user: User, queryRunner: QueryRunner): Promise<Link[]> {
    try {
      return await this.linkRepository.createGuideLinks(user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(
        ResponseCode.INTERNAL_SERVER_ERROR,
        '회원가입에 실패하였습니다. 다시 시도해 주세요.',
        {
          status: 500,
        },
      );
    }
  }

  async createLink(body: CreateLinkDto, user: User): Promise<Link> {
    const kloud = await this.validateKloudId(body.kloudId, user);

    try {
      return await this.linkRepository.createLink(body, user, kloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, ResponseCode.INTERNAL_SERVER_ERROR, {
        status: 500,
      });
    }
  }

  async getLinks(user: User, query: GetLinksDto): Promise<{ linkCount: number; links: Link[] }> {
    try {
      return await this.linkRepository.findLinksByParams(user, query);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', { status: 500 });
    }
  }

  async getLinkDetail(id: number, user: User): Promise<Link> {
    let foundLink: Link | null;

    try {
      foundLink = await this.linkRepository.findLinkByIdAndUser(id, user);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', {
        status: 500,
      });
    }

    if (!foundLink) {
      throw new CustomHttpException(ResponseCode.LINK_NOT_FOUND, ResponseCode.LINK_NOT_FOUND, { status: 404 });
    }

    return foundLink;
  }

  async updateLinkRead(id: number, user: User): Promise<Link> {
    const foundLink = await this.getLinkDetail(id, user);

    if (foundLink.isRead === true) {
      // 이미 열람 처리된 링크일 경우 DB 업데이트 로직을 실행하지 않고 종료
      return foundLink;
    }

    try {
      return await this.linkRepository.updateLinkRead(foundLink);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '링크 열람 처리에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  async updateLink(id: number, body: UpdateLinkDto, user: User): Promise<Link> {
    const foundLink = await this.getLinkDetail(id, user);

    let kloud: Kloud | null = null;

    if (body.kloudId !== undefined) {
      // kloudId를 클라이언트에서 넘겼을 때만 kloud 찾는 로직 실행
      kloud = await this.validateKloudId(body.kloudId, user);
    }

    try {
      return await this.linkRepository.updateLink(body, foundLink, kloud);
    } catch (error) {
      throw new CustomHttpException(
        ResponseCode.INTERNAL_SERVER_ERROR,
        '링크 수정에 실패하였습니다. 다시 시도해 주세요.',
        { status: 500 },
      );
    }
  }

  async deleteLinkById(id: number, user: User): Promise<Link> {
    const foundLink = await this.getLinkDetail(id, user);

    try {
      return await this.linkRepository.deleteLinkById(foundLink);
    } catch (error) {
      throw new CustomHttpException(
        ResponseCode.INTERNAL_SERVER_ERROR,
        '링크 삭제에 실패하였습니다. 다시 시도해 주세요.',
        { status: 500 },
      );
    }
  }

  /**
   * @description linkIds에 해당하는 링크들의 클라우드를 kloudId에 해당하는 클라우드로 일괄 변경
   */
  async updateLinksKloud(
    linkIds: number[],
    kloudId: number | null,
    user: User,
    queryRunner: QueryRunner,
  ): Promise<Link[]> {
    if (kloudId === undefined) {
      throw new CustomHttpException(ResponseCode.INVALID_PARAMS, '이동할 클라우드가 전달되지 않았습니다.');
    }

    const foundLinks = await this.validateLinkIds(linkIds, user, queryRunner);

    let kloud: Kloud | null = null;

    if (kloudId) {
      try {
        kloud = await this.kloudRepository.findKloudByIdAndUserWithTransaction(kloudId, user, queryRunner);
      } catch (error) {
        throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드를 찾을 수 없습니다.', {
          status: 500,
        });
      }

      if (!kloud) {
        throw new CustomHttpException(ResponseCode.KLOUD_NOT_FOUND, '선택한 클라우드를 찾을 수 없습니다.', {
          status: 404,
        });
      }
    }

    try {
      return await this.linkRepository.updateLinksKloud(foundLinks, kloud, queryRunner);
    } catch (error) {
      throw new CustomHttpException(
        ResponseCode.INTERNAL_SERVER_ERROR,
        '선택한 링크의 클라우드를 변경하지 못하였습니다. 다시 시도해 주세요.',
        { status: 500 },
      );
    }
  }

  /**
   * @description linkIds에 해당하는 링크들을 일괄 제거
   */
  async deleteLinks(linkIds: number[], user: User, queryRunner: QueryRunner): Promise<Link[]> {
    const foundLinks = await this.validateLinkIds(linkIds, user, queryRunner);

    try {
      return await this.linkRepository.deleteLinks(foundLinks, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '선택한 링크 삭제에 실패하였습니다.', {
        status: 500,
      });
    }
  }

  /**
   * @description linkIds 배열과 linkIds에 해당하는 링크들을 검증
   */
  private async validateLinkIds(linkIds: number[], user: User, queryRunner: QueryRunner): Promise<Link[]> {
    if (!linkIds || !linkIds.length) {
      throw new CustomHttpException(ResponseCode.INVALID_PARAMS, '링크가 전달되지 않았습니다.');
    }

    if (new Set(linkIds).size !== linkIds.length) {
      throw new CustomHttpException(ResponseCode.INVALID_PARAMS, '중복된 링크가 존재합니다.');
    }

    let foundLinks: Link[] | [];

    try {
      foundLinks = await this.linkRepository.findLinksByIdAndUser(linkIds, user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', { status: 500 });
    }

    if (foundLinks.length !== linkIds.length) {
      throw new CustomHttpException(ResponseCode.LINK_NOT_FOUND, ResponseCode.LINK_NOT_FOUND, { status: 404 });
    }

    return foundLinks;
  }

  /**
   * @description kloudId에 해당하는 클라우드가 있는지 검증
   */
  private async validateKloudId(kloudId: number | null, user: User): Promise<Kloud | null> {
    let kloud: Kloud | null = null;

    if (kloudId === undefined) {
      throw new CustomHttpException(ResponseCode.INVALID_PARAMS, 'kloudId가 누락되었습니다.');
    }

    if (kloudId) {
      try {
        kloud = await this.kloudRepository.findKloudByIdAndUser(kloudId, user);
      } catch (error) {
        throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '클라우드를 조회하는 데에 실패하였습니다.', {
          status: 500,
        });
      }

      if (!kloud) {
        throw new CustomHttpException(ResponseCode.KLOUD_NOT_FOUND, '선택한 클라우드를 찾을 수 없습니다.', {
          status: 404,
        });
      }
    }

    return kloud;
  }
}
