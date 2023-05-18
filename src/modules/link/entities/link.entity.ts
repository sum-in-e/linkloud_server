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
  // TODO: og:image cdn으로 해서 클라우드에 올리고 url 할당하고 관련된 부분 싹바꿀까

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string; // 글자수 제한이 없으니 클라이언트에서 보여줄 때 ellipsis 처리 필요

  @Column({ type: 'text', default: '' })
  memo!: string; // 타입을 TEXT로 하되 클라이언트에서 글자 제한을 둘까?

  @Column({ default: false })
  isInMyCollection!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Cloud, (cloud) => cloud.links, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  cloud!: Cloud | null;

  @ManyToOne(() => User, (user) => user.links, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: User;
}
