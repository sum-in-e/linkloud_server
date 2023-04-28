import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async findAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  //   async updateUser(id: number, user: User): Promise<User> {
  //     await this.userRepository.update(id, user);
  //     return await this.userRepository.findOne(id);
  //   }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
