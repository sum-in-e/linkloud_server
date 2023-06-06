import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
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

  @Column({ type: 'varchar', length: 255 })
  url!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailUrl!: string | null; // og:image 있으면 할당하고 없으면 null -> 클라이언트에서 이미지 저장하고 null이면 할당
  // TODO: link analyze에서 기본이미지 url 반환 할거니까 url null 지우기

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  description!: string; // 글자수 제한이 없으니 클라이언트에서 보여줄 때 ellipsis 처리 필요

  @Column({ type: 'text' })
  memo = ''; // 타입을 TEXT로 하되 클라이언트에서 글자 제한을 둘까?

  @Column({ type: 'text' })
  test = ''; // 타입을 TEXT로 하되 클라이언트에서 글자 제한을 둘까?

  @Column({ default: false })
  isInMyCollection!: boolean;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Cloud, (cloud) => cloud.links, {
    onDelete: 'CASCADE', // 클라우드가 삭제될 때, 해당 클라우드를 참조하고 있는 링크도 함께 삭제된다.
    onUpdate: 'CASCADE',
  })
  cloud!: Cloud | null;

  @ManyToOne(() => User, (user) => user.links, {
    onDelete: 'CASCADE', // 유저가 삭제될 때, 해당 유저를 참조하고 있는 링크도 함께 삭제된다.
    onUpdate: 'CASCADE',
  })
  user!: User;
}
