import { Cloud } from 'src/modules/cloud/entities/cloud.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  BeforeInsert,
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

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string; // 글자수 제한이 없으니 클라이언트에서 보여줄 때 ellipsis 처리 필요

  @Column({ type: 'text', nullable: true })
  memo!: string | null; // 타입을 TEXT로 하되 클라이언트에서 글자 제한을 둘까?

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
  cloud!: Cloud;

  @ManyToOne(() => User, (user) => user.links, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: User;

  // og:title이 없으면 url을 title로 설정
  @BeforeInsert()
  setTitleFromUrl() {
    if (!this.title) {
      this.title = this.url;
    }
  }
}
