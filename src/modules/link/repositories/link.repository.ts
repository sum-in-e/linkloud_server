import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { Link } from 'src/modules/link/entities/link.entity';
import { CreateLinkDto } from 'src/modules/link/dto/link.dto';

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
}
