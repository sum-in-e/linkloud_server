import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
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

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt!: Date | null;

  @OneToMany(() => Link, (link) => link.user, {
    onDelete: 'CASCADE', // 유저가 삭제될 때 연결된 링크도 삭제
    onUpdate: 'CASCADE',
  })
  links!: Link[] | [];

  @OneToMany(() => Kloud, (kloud) => kloud.user, {
    onDelete: 'CASCADE', // 유저가 삭제될 때 연결된 클라우드도 삭제
    onUpdate: 'CASCADE',
  })
  klouds!: Kloud[] | [];
}
