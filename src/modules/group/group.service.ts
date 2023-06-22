import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { KloudRepository } from 'src/modules/kloud/repository/kloud.repository';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';
import { User } from 'src/modules/user/entities/user.entity';

interface getGroupsCountResponse {
  myCollection: number;
  all: number;
  unread: number;
  uncategorized: number;
  klouds: Kloud[] | [];
}

@Injectable()
export class GroupsService {
  constructor(private readonly linkRepository: LinkRepository, private readonly kloudRepository: KloudRepository) {}
  async getGroupsCountByUser(user: User): Promise<getGroupsCountResponse> {
    try {
      const myCollection = await this.linkRepository.countLinksInMyCollection(user);
      const all = await this.linkRepository.countAllLinks(user);
      const unread = await this.linkRepository.countUnreadLinks(user);
      const uncategorized = await this.linkRepository.countUncategorizedLinks(user);
      const klouds = await this.kloudRepository.getKlouds(user);

      return {
        all,
        myCollection,
        unread,
        uncategorized,
        klouds,
      };
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INTERNAL_SERVER_ERROR, '조회 실패', {
        status: 500,
      });
    }
  }
}
