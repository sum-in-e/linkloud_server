import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { KakaoSignUpDto, SignUpDto } from 'src/modules/user/dto/user.dto';

// 💡repository 내에서 에러를 던지는 것은 좋지 않다. repository는 데이터베이스와 통신하는 로직만 담당하고, 에러 처리는 service나 controller에서 하는 것이 좋다.
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return await User.findOne({ where: { email } });
  }

  async createUserByEmail(body: SignUpDto, hashedPassword: string): Promise<User> {
    const user = new User();
    user.email = body.email;
    user.password = hashedPassword;
    user.name = body.name;
    user.method = 'email';

    return await this.userRepository.save(user);
  }

  async createUserByKakao(body: KakaoSignUpDto): Promise<User> {
    const user = new User();
    user.email = body.email;
    user.name = body.name;
    user.method = 'kakao';

    return await this.userRepository.save(user);
  }
}
