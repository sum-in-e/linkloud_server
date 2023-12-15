import { Kloud } from 'src/modules/kloud/entities/kloud.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Link {
  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true,
  })
  id!: number;

  @Column({ type: 'varchar', length: 1000 })
  url!: string;

  @Column({ type: 'varchar', length: 1000 })
  thumbnailUrl!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  memo = '';

  @Column({ default: false })
  isFollowing!: boolean;

  @Column({ type: 'int', default: 0 })
  clickCount!: number;

  @Column({ type: 'float', nullable: true })
  clickFrequency: number | null = null; // 클릭 주기(시간 단위, 소수점 첫째자리까지 허용)

  @Column({ type: 'datetime', nullable: true })
  lastClickedAt: Date | null = null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Kloud, (kloud) => kloud.links, {
    onDelete: 'CASCADE', // 클라우드가 삭제될 때, 해당 클라우드를 참조하고 있는 링크도 함께 삭제된다.
    onUpdate: 'CASCADE',
  })
  kloud!: Kloud | null;

  @ManyToOne(() => User, (user) => user.links, {
    onDelete: 'CASCADE', // 유저가 삭제될 때, 해당 유저를 참조하고 있는 링크도 함께 삭제된다.
    onUpdate: 'CASCADE',
  })
  user!: User;
}
