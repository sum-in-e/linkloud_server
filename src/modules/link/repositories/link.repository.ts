import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { Link } from 'src/modules/link/entities/link.entity';
import { CreateLinkDto } from 'src/modules/link/dto/link.dto';
import { guideLinks } from 'src/modules/link/constants/guide-links.constant';

@Injectable()
export class LinkRepository {
  constructor(
    @InjectRepository(Link)
    private linkRepository: Repository<Link>,
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
}
