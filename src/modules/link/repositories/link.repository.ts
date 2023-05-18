import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { Link } from 'src/modules/link/entities/link.entity';
import { CreateLinkDto, UpdateLinkDto } from 'src/modules/link/dto/link.dto';
import { guideLinks } from 'src/modules/link/constants/guide-links.constant';

@Injectable()
export class LinkRepository {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  async createLink(body: CreateLinkDto, user: User, cloud: Cloud | null): Promise<Link> {
    const link = new Link();
    link.url = body.url;
    link.thumbnailUrl = body.thumbnailUrl;
    link.title = body.title;
    link.description = body.description;
    link.cloud = cloud;
    link.user = user;

    return await this.linkRepository.save(link);
  }

  async createGuideLinks(user: User, queryRunner: QueryRunner): Promise<Link[]> {
    const links = guideLinks.map((guide) => {
      const link = new Link();
      link.url = guide.url;
      link.thumbnailUrl = guide.thumbnailUrl;
      link.title = guide.title;
      link.description = guide.description;
      link.memo = guide.memo;
      link.cloud = guide.cloud;
      link.user = user;
      return link;
    });

    return await queryRunner.manager.save(links); // save 메소드는 단일 엔티티 또는 엔티티 배열을 인자로 받아 저장할 수 있다.
  }

  async countLinksInMyCollection(user: User): Promise<number> {
    return await this.linkRepository.count({
      where: {
        user: { id: user.id },
        isInMyCollection: true,
      },
    });
  }

  async findLinkByIdAndUser(id: number, user: User): Promise<Link | null> {
    return await this.linkRepository.findOne({
      where: {
        id: id,
        user: { id: user.id },
      },
      relations: ['cloud'],
    });
  }

  async updateLink(body: UpdateLinkDto, link: Link, cloud: Cloud | null): Promise<Link> {
    link.url = body.url || link.url;
    link.title = body.title || link.title;
    link.description = body.description !== undefined ? body.description : link.description; // 내용 지우고 저장해서 빈문자열 보낼 수 있음
    link.memo = body.memo !== undefined ? body.memo : link.memo; // 매모 지우고 저장해서 빈문자열 보낼 수 있음
    link.isInMyCollection = body.isInMyCollection !== undefined ? body.isInMyCollection : link.isInMyCollection; // false들어오면 에러 날 수 있어서 삼항 씀
    link.cloud = body.cloudId !== undefined ? cloud : link.cloud;

    return await this.linkRepository.save(link);
  }
}
