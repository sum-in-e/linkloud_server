import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { CreateLinkDto, UpdateLinkDto } from 'src/modules/link/dto/link.dto';
import { Link } from 'src/modules/link/entities/link.entity';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';
import { User } from 'src/modules/user/entities/user.entity';
import { QueryRunner } from 'typeorm';

@Injectable()
export class LinkService {
  constructor(private readonly linkRepository: LinkRepository, private readonly cloudRepository: CloudRepository) {}

  async createGuideLinks(user: User, queryRunner: QueryRunner): Promise<Link[]> {
    try {
      return await this.linkRepository.createGuideLinks(user, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, ResponseCode.INTERNAL_SERVER_ERROR, {
        status: 500,
      });
    }
  }

  async createLink(body: CreateLinkDto, user: User): Promise<Link> {
    const cloud = await this.validateCloudId(body.cloudId, user);

    try {
      return await this.linkRepository.createLink(body, user, cloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, ResponseCode.INTERNAL_SERVER_ERROR, {
        status: 500,
      });
    }
  }

  async getLinkCountInMyCollection(user: User): Promise<number> {
    try {
      return await this.linkRepository.countLinksInMyCollection(user);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', {
        status: 500,
      });
    }
  }

  async getLinks(
    sort: string,
    limit: number,
    offset: number,
    user: User,
    keyword?: string,
    isRead?: string,
    myCollection?: string,
    cloudId?: string,
  ): Promise<{ linkCount: number; links: Link[] }> {
    try {
      return await this.linkRepository.findLinksByParams(
        sort,
        limit,
        offset,
        user,
        keyword,
        isRead,
        myCollection,
        cloudId,
      );
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
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '열람 처리 실패', {
        status: 500,
      });
    }
  }

  async updateLink(id: number, body: UpdateLinkDto, user: User): Promise<Link> {
    const foundLink = await this.getLinkDetail(id, user);

    let cloud: Cloud | null = null;

    if (body.cloudId !== undefined) {
      // cloudId를 클라이언트에서 넘겼을 때만 cloud 찾는 로직 실행
      cloud = await this.validateCloudId(body.cloudId, user);
    }

    try {
      return await this.linkRepository.updateLink(body, foundLink, cloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '수정 실패', { status: 500 });
    }
  }

  async deleteLinkById(id: number, user: User): Promise<Link> {
    const foundLink = await this.getLinkDetail(id, user);

    try {
      return await this.linkRepository.deleteLinkById(foundLink);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '삭제 실패', { status: 500 });
    }
  }

  /**
   * @description linkIds에 해당하는 링크들의 클라우드를 cloudId에 해당하는 클라우드로 일괄 변경
   */
  async updateLinksCloud(
    linkIds: number[],
    cloudId: number | null,
    user: User,
    queryRunner: QueryRunner,
  ): Promise<Link[]> {
    if (cloudId === undefined) {
      throw new CustomHttpException(ResponseCode.INVALID_PARAMS, 'cloudId가 누락되었습니다.');
    }

    const foundLinks = await this.validateLinkIds(linkIds, user, queryRunner);

    let cloud: Cloud | null = null;

    if (cloudId) {
      try {
        cloud = await this.cloudRepository.findCloudByIdAndUserWithTransaction(cloudId, user, queryRunner);
      } catch (error) {
        throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', { status: 500 });
      }

      if (!cloud) {
        throw new CustomHttpException(ResponseCode.CLOUD_NOT_FOUND);
      }
    }

    try {
      return await this.linkRepository.updateLinksCloud(foundLinks, cloud, queryRunner);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '이동 실패', { status: 500 });
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
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '삭제 실패', { status: 500 });
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
      throw new CustomHttpException(ResponseCode.LINK_NOT_FOUND);
    }

    return foundLinks;
  }

  /**
   * @description cloudId에 해당하는 클라우드가 있는지 검증
   */
  private async validateCloudId(cloudId: number | null, user: User): Promise<Cloud | null> {
    let cloud: Cloud | null = null;

    if (cloudId === undefined) {
      throw new CustomHttpException(ResponseCode.INVALID_PARAMS, 'cloudId가 누락되었습니다.');
    }

    if (cloudId) {
      try {
        cloud = await this.cloudRepository.findCloudByIdAndUser(cloudId, user);
      } catch (error) {
        throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', { status: 500 });
      }

      if (!cloud) {
        throw new CustomHttpException(ResponseCode.CLOUD_NOT_FOUND);
      }
    }

    return cloud;
  }
}
