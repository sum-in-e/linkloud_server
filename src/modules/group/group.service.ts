import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';
import { User } from 'src/modules/user/entities/user.entity';

interface getGroupsCountResponse {
  myCollection: number;
  all: number;
  unread: number;
  uncategorized: number;
  clouds: Cloud[] | [];
}

@Injectable()
export class GroupsService {
  constructor(private readonly linkRepository: LinkRepository, private readonly cloudRepository: CloudRepository) {}
  async getGroupsCountByUser(user: User): Promise<getGroupsCountResponse> {
    try {
      const myCollection = await this.linkRepository.countLinksInMyCollection(user);
      const all = await this.linkRepository.countAllLinks(user);
      const unread = await this.linkRepository.countUnreadLinks(user);
      const uncategorized = await this.linkRepository.countUncategorizedLinks(user);
      const clouds = await this.cloudRepository.getClouds(user);

      return {
        all,
        myCollection,
        unread,
        uncategorized,
        clouds,
      };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', {
        status: 500,
      });
    }
  }
}
