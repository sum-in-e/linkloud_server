import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, QueryRunner, Repository } from 'typeorm';
import { KakaoVericationInfo } from 'src/modules/user/entities/kakao-verification-info.entity';

// 💡repository 내에서 에러를 던지는 것은 좋지 않다. repository는 데이터베이스와 통신하는 로직만 담당하고, 에러 처리는 service나 controller에서 하는 것이 좋다.
@Injectable()
export class KakaoVericationInfoRepository {
  constructor(
    @InjectRepository(KakaoVericationInfo)
    private kakaoVericationInfoRepository: Repository<KakaoVericationInfo>,
  ) {}

  async createKakaoVerificationInfo(email: string, sub: string): Promise<KakaoVericationInfo> {
    const kakaoVericationInfo = new KakaoVericationInfo();
    kakaoVericationInfo.sub = sub;
    kakaoVericationInfo.email = email;

    return await this.kakaoVericationInfoRepository.save(kakaoVericationInfo);
  }

  async findEmailBySub(sub: string, queryRunner: QueryRunner): Promise<KakaoVericationInfo | null> {
    return await queryRunner.manager.getRepository(KakaoVericationInfo).findOne({ where: { sub } });
  }

  async deleteKakaoVerificationInfo(email: string, queryRunner: QueryRunner): Promise<DeleteResult> {
    return await queryRunner.manager.getRepository(KakaoVericationInfo).delete({ email });
  }
}
