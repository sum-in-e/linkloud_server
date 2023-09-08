import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { Link } from 'src/modules/link/entities/link.entity';
import { CreateLinkDto, GetLinksDto, UpdateLinkDto } from 'src/modules/link/dto/link.dto';
import { guideLinks } from 'src/modules/link/constants/guide-links.constant';

@Injectable()
export class LinkRepository {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  async createLink(body: CreateLinkDto, user: User, kloud: Kloud | null): Promise<Link> {
    const link = new Link();
    link.url = body.url;
    link.thumbnailUrl = body.thumbnailUrl;
    link.title = body.title;
    link.description = body.description;
    link.kloud = kloud;
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
      link.kloud = guide.kloud;
      link.user = user;
      return link;
    });

    return await queryRunner.manager.save(links); // save 메소드는 단일 엔티티 또는 엔티티 배열을 인자로 받아 저장할 수 있다.
  }

  /**
   * @description 유저가 소유한 링크를 조회합니다.
   */
  async findLinksByUser(user: User, queryRunner: QueryRunner): Promise<Link[] | []> {
    return await queryRunner.manager
      .createQueryBuilder(Link, 'link')
      .where('link.user.id = :userId', { userId: user.id })
      .getMany();
  }

  async findLinksByParams(user: User, query: GetLinksDto): Promise<{ linkCount: number; links: Link[] }> {
    const { sort, limit, offset, keyword, isRead, myCollection, kloudId } = query;

    let queryBuilder = this.linkRepository
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.kloud', 'kloud')
      .where('link.user.id = :userId', { userId: user.id });

    if (isRead !== undefined) {
      queryBuilder = queryBuilder.andWhere('link.isRead = :isRead', { isRead });
    }

    if (myCollection !== undefined) {
      queryBuilder = queryBuilder.andWhere('link.isInMyCollection = :isInMyCollection', {
        isInMyCollection: myCollection,
      });
    }

    if (kloudId !== undefined) {
      if (kloudId === 0) {
        queryBuilder = queryBuilder.andWhere('link.kloud.id IS NULL');
      } else {
        queryBuilder = queryBuilder.andWhere('link.kloud.id = :kloudId', { kloudId });
      }
    }

    if (keyword !== undefined && keyword !== '') {
      queryBuilder = queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('link.title LIKE :keyword', { keyword: `%${keyword}%` }) // 제목에 키워드가 포함된 경우
            .orWhere('link.url LIKE :keyword', { keyword: `%${keyword}%` }); // URL에 키워드가 포함된 경우
        }),
      );
    }

    const linkCount = await queryBuilder.getCount(); // 별도의 쿼리 빌더를 생성하여 linkCount를 계산한다. links에 같이 count 까지 나오게하면 전체 count가 나오지 않음. (skip, take에 영향을 받기 때문)
    const links = await queryBuilder.orderBy('link.createdAt', sort).skip(offset).take(limit).getMany();

    return { linkCount, links };
  }

  async findLinkByIdAndUser(id: number, user: User): Promise<Link | null> {
    return await this.linkRepository.findOne({
      where: {
        id: id,
        user: { id: user.id },
      },
      relations: ['kloud'],
    });
  }

  async addLinkCount(link: Link): Promise<Link> {
    const now = new Date();
    const newCount = link.clickCount + 1;

    if (link.lastClickedAt) {
      // 시간을 밀리세컨드 단위로 환산하여 현재와 마지막 클릭 일자 사이의 시간 차이를 계산
      const hoursDifference = (now.getTime() - link.lastClickedAt.getTime()) / (1000 * 60 * 60);

      if (link.clickFrequency) {
        // 세 번째 클릭부터 이전 주기, 이전까지 클릭한 카운트, 새로운 시간차이, 새 카운트를 가지고 평균 클릭 주기를 계산한다.
        link.clickFrequency = (link.clickFrequency * link.clickCount + hoursDifference) / newCount;
      } else {
        // 두 번째 클릭 시 - 이때부터 주기를 계산한다 ("클릭 주기"라는 개념은 일반적으로 두 개 이상의 클릭 이벤트가 있어야 의미가 있음)
        // 두 번째 클릭이 발생한 시점에서 첫 번째 클릭과의 시간 차이를 구하고, 이를 기반으로 클릭 주기를 계산한다.
        link.clickFrequency = hoursDifference;
      }
    }

    link.clickCount = newCount;
    link.lastClickedAt = now;

    return await this.linkRepository.save(link);
  }

  async updateLink(body: UpdateLinkDto, link: Link, kloud: Kloud | null): Promise<Link> {
    if (body.title) link.title = body.title;
    if (body.description !== undefined) link.description = body.description; // 빈 문자열을 보낼 수 있기 때문에 falsy한 값으로만 식별하면 안 된다.
    if (body.memo !== undefined) link.memo = body.memo;
    if (body.isInMyCollection !== undefined) link.isInMyCollection = body.isInMyCollection;
    if (body.kloudId !== undefined) link.kloud = kloud;

    return await this.linkRepository.save(link);
  }

  async updateLinksKloud(links: Link[], kloud: Kloud | null, queryRunner: QueryRunner): Promise<Link[]> {
    links.forEach((link) => {
      link.kloud = kloud;
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

  async deleteLinks(links: Link[], queryRunner: QueryRunner): Promise<Link[]> {
    return await queryRunner.manager.remove(links);
  }

  async countLinksInMyCollection(user: User): Promise<number> {
    return await this.linkRepository.count({
      where: {
        user: { id: user.id },
        isInMyCollection: true,
      },
    });
  }

  async countAllLinks(user: User): Promise<number> {
    return await this.linkRepository.count({
      where: {
        user: { id: user.id },
      },
    });
  }

  async countUnreadLinks(user: User): Promise<number> {
    return await this.linkRepository.count({
      where: {
        user: { id: user.id },
        isRead: false,
      },
    });
  }

  async countUncategorizedLinks(user: User): Promise<number> {
    return await this.linkRepository
      .createQueryBuilder('link')
      .leftJoin('link.kloud', 'kloud')
      .where('link.user.id = :userId', { userId: user.id })
      .andWhere('link.kloud.id IS NULL')
      .getCount();
  }
}
