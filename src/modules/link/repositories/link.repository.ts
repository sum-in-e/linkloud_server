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

  async findLinksByParams(
    isRead: string | undefined,
    myCollection: string | undefined,
    cloudId: string | undefined,
    sort: string,
    limit: number,
    offset: number,
    user: User,
  ): Promise<{ linkCount: number; links: Link[] }> {
    const order = sort === 'DESC' ? 'DESC' : 'ASC';

    let query = this.linkRepository
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.cloud', 'cloud') // cloud 관계를 로드
      .where('link.user = :user', { user: user.id });

    if (isRead !== undefined) {
      query = query.andWhere('link.isRead = :isRead', { isRead: isRead === 'true' });
    }

    if (myCollection !== undefined) {
      query = query.andWhere('link.isInMyCollection = :isInMyCollection', {
        isInMyCollection: myCollection === 'true',
      });
    }

    if (cloudId !== undefined) {
      if (cloudId === '0') {
        query = query.andWhere('link.cloud.id IS NULL');
      } else {
        query = query.andWhere('link.cloud.id = :cloudId', { cloudId });
      }
    }

    const linkCount = await query.getCount(); // 별도의 쿼리 빌더를 생성하여 linkCount를 계산한다. links에 같이 count 까지 나오게하면 skip, take에 영향받은 count가 받아지기 때문에

    const links = await query.orderBy('link.createdAt', order).skip(offset).take(limit).getMany();

    return { linkCount, links };
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

  async updateLinkRead(link: Link): Promise<Link> {
    link.isRead = true;
    link.readAt = new Date();
    return await this.linkRepository.save(link);
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

  async updateLinksCloud(links: Link[], cloud: Cloud | null, queryRunner: QueryRunner): Promise<Link[]> {
    links.forEach((link) => {
      link.cloud = cloud;
    });
    return await queryRunner.manager.save(links);
  }

  async deleteLinkById(link: Link): Promise<Link> {
    return await this.linkRepository.remove(link);
  }

  async findLinksByIdAndUser(linkIds: number[], user: User, queryRunner: QueryRunner): Promise<Link[]> {
    return await queryRunner.manager
      .createQueryBuilder(Link, 'link')
      .where('link.id IN (:...linkIds)', { linkIds })
      .andWhere('link.user.id = :userId', { userId: user.id })
      .getMany();
  }

  async deleteLinks(findedLinks: Link[], queryRunner: QueryRunner): Promise<Link[]> {
    return await queryRunner.manager.remove(findedLinks);
  }
}
