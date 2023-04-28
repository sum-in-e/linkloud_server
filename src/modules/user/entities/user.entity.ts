import { AuthMethodType } from 'src/modules/user/types/user.type';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true, // 해당 컬럼이 양수 값만 허용하도록  할지 여부
  })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 32 })
  name: string;

  @Column()
  method: AuthMethodType;

  // @CreateDateColumn? 데이터가 생성된 시간을 기록해주는 데코레이터
  @CreateDateColumn({ type: 'datetime', nullable: false })
  createdAt: Date;

  @Column({ type: 'boolean', default: false, nullable: false })
  isInactive: boolean;

  @Column({ nullable: true })
  inactivedAt: Date | null;

  @Column({ nullable: true })
  updatedAt: Date | null;

  @Column({ nullable: true })
  deletedAt: Date | null;
}
