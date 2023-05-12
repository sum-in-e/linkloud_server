import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { Link } from 'src/modules/link/entities/link.entity';
import { AuthMethodType } from 'src/modules/user/types/user.type';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true, // 해당 컬럼이 양수 값만 허용하도록  할지 여부
  })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column()
  method!: AuthMethodType;

  @Column({ type: 'boolean', default: false })
  isInactive!: boolean;

  @Column({ type: 'datetime', nullable: true })
  inactivedAt: Date | null = null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => Link, (link) => link.user, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  links!: Link[] | [];

  @OneToMany(() => Cloud, (cloud) => cloud.user, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  clouds!: Cloud[];
}
