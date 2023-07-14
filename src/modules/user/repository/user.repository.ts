import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { SignUpDto } from 'src/modules/user/dto/user.dto';

// 💡repository 내에서 에러를 던지는 것은 좋지 않다. repository는 데이터베이스와 통신하는 로직만 담당하고, 에러 처리는 service나 controller에서 하는 것이 좋다.
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * @description id에 해당하는 유저를 찾는 메서드(AuthGuard 전용)
   */
  async findUserByIdForAuthGuard(id: number): Promise<User | null> {
    // 💡 로그인 과정에서 회원 탈퇴나 휴면 처리된 사용자에 대한 체크를 하고 있다면 이를 AuthGuard에서 다시 체크할 필요는 없다.일반적으로 로그인 과정에서 이러한 사용자 상태를 체크하고, 필요한 경우 해당 사용자를 로그인할 수 없게 하며, 필요한 오류 메시지를 반환하도록 한다. 따라서 AuthGuard에서는 일반적으로 해당 사용자가 유효한 토큰을 가지고 있는지, 토큰이 해당 사용자의 것이 맞는지만 확인하면 된다.
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * @description 회원가입/로그인에서 이메일을 가진 유저를 조회하기 위해 사용합니다.
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email }, withDeleted: true }); // deleted_at이 있는 유저도 불러옴 -> 회원가입, 로그인에서 탈퇴 계정 안내하려고
  }

  /**
   * @description 회원가입/로그인에서 이메일을 가진 유저를 조회하기 위해 사용합니다. (트랜잭션 적용)
   */
  async findUserByEmailInTransaction(email: string, queryRunner: QueryRunner): Promise<User | null> {
    return await queryRunner.manager.getRepository(User).findOne({ where: { email }, withDeleted: true }); // deleted_at이 있는 유저도 불러옴 -> 회원가입, 로그인에서 탈퇴 계정 안내하려고
  }

  async createUserByEmail(body: SignUpDto, hashedPassword: string, queryRunner: QueryRunner): Promise<User> {
    const user = new User();
    user.email = body.email;
    user.password = hashedPassword;
    user.name = body.name;
    user.method = 'email';

    return await queryRunner.manager.save(user);
  }

  async createUserByKakao(email: string, name: string, queryRunner: QueryRunner): Promise<User> {
    const user = new User();
    user.email = email;
    user.name = name;
    user.method = 'kakao';

    return await queryRunner.manager.save(user);
  }

  async updateLastLoginAt(user: User, queryRunner?: QueryRunner): Promise<User> {
    user.lastLoginAt = new Date();

    if (queryRunner) {
      return await queryRunner.manager.save(user);
    }
    return await this.userRepository.save(user);
  }

  async deleteUser(user: User, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.softDelete(User, user.id);
  }

  /**
   * @description 정상 상태의 유저 중 미열람 링크가 10개 이상이고 구독 등록이 되어있는 유저를 찾습니다.
   */
  async findUsersWithUnreadLinksOverTen(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.subscriptions', 'subscription') //
      .leftJoin('user.links', 'link', 'link.isRead = :isRead', { isRead: false })
      .andWhere('user.isInactive = :isInactive', { isInactive: false }) // 휴면 상태 아닌 유저
      .andWhere('user.deletedAt IS NULL') // 탈퇴 상태 아닌 유저
      .groupBy('user.id')
      .having('COUNT(link.id) >= 10')
      .getMany();
  }
}
