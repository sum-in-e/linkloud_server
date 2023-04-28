import { AuthMethodType } from 'src/modules/user/types/user.type';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true, // 해당 컬럼이 양수 값만 허용하도록  할지 여부
  })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 64 })
  password!: string;

  @Column({ type: 'varchar', length: 32 })
  name!: string;

  @Column()
  method!: AuthMethodType;

  @Column({ type: 'boolean', default: false, nullable: false })
  isInactive!: boolean;

  @Column({ type: 'datetime', nullable: true })
  inactivedAt: Date | null = null;

  @CreateDateColumn({ type: 'datetime', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updatedAt: Date | null = null;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date | null = null;
}
