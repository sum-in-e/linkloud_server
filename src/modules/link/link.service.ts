import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { CloudRepository } from 'src/modules/cloud/repository/cloud.repository';
import { CreateLinkDto } from 'src/modules/link/dto/link.dto';
import { Link } from 'src/modules/link/entities/link.entity';
import { LinkRepository } from 'src/modules/link/repositories/link.repository';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class LinkService {
  constructor(private readonly linkRepository: LinkRepository, private readonly cloudRepository: CloudRepository) {}

  async createLink(body: CreateLinkDto, user: User): Promise<Link> {
    let cloud: Cloud | null = null;

    if (body.cloudId) {
      // 클라우드 지정 했으면 클라우드 찾기
      const findedCloud = await this.cloudRepository.findCloudByIdAndUser(body.cloudId, user.id);

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
}
