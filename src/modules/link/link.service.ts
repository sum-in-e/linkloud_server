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

  async createLink(body: CreateLinkDto, user: User): Promise<Link> {
    let cloud: Cloud | null = null;

    if (body.cloudId) {
      // 클라우드 지정 했으면 클라우드 찾기
      const findedCloud = await this.cloudRepository.findCloudByIdAndUser(body.cloudId, user);

      if (!findedCloud) {
        throw new CustomHttpException(ResponseCode.CLOUD_NOT_FOUND);
      }

      cloud = findedCloud;
    }

    try {
      return await this.linkRepository.createLink(body, user, cloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, ResponseCode.INTERNAL_SERVER_ERROR, {
        status: 500,
      });
    }
  }

  async createGuideLinks(user: User, queryRunner: QueryRunner): Promise<Link[]> {
    try {
      return await this.linkRepository.createGuideLinks(user, queryRunner);
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

  async getLinkDetail(id: number, user: User): Promise<Link> {
    let findedLink: Link | null;

    try {
      findedLink = await this.linkRepository.findLinkByIdAndUser(id, user);
    } catch (error) {
      // DB와 통신하는 동안 발생하는 예외를 처리
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', {
        status: 500,
      });
    }

    if (!findedLink) {
      throw new CustomHttpException(ResponseCode.LINK_NOT_FOUND);
    }

    return findedLink;
  }

  async updateLink(id: number, body: UpdateLinkDto, user: User): Promise<Link> {
    let findedLink: Link | null;

    try {
      findedLink = await this.linkRepository.findLinkByIdAndUser(id, user);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', { status: 500 });
    }

    if (!findedLink) {
      throw new CustomHttpException(ResponseCode.LINK_NOT_FOUND);
    }

    let cloud: Cloud | null = null;

    if (body.cloudId) {
      const findedCloud = await this.cloudRepository.findCloudByIdAndUser(body.cloudId, user);

      if (!findedCloud) {
        throw new CustomHttpException(ResponseCode.CLOUD_NOT_FOUND);
      }

      cloud = findedCloud;
    }

    try {
      return await this.linkRepository.updateLink(body, findedLink, cloud);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '수정 실패', { status: 500 });
    }
  }

  async deleteLinkById(id: number, user: User): Promise<Link> {
    const findedLink = await this.getLinkDetail(id, user);

    try {
      return await this.linkRepository.deleteLinkById(findedLink);
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '삭제 실패', { status: 500 });
    }
  }
}
