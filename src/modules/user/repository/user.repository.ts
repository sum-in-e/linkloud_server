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

  async findUserByEmailWithoutDeleted(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email }, withDeleted: true }); // deleted_at이 있는 유저도 불러옴 -> 회원가입, 로그인에서 써서 탈퇴 계정 안내하려고
  }

  async findUserByEmailInTransaction(email: string, queryRunner: QueryRunner): Promise<User | null> {
    return await queryRunner.manager.getRepository(User).findOne({ where: { email } });
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
}
