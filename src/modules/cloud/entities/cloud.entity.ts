import { Link } from 'src/modules/link/entities/link.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Cloud {
  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true,
  })
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  description!: string; // 기획적으로는 아직 쓰일 일이 없지만 추후 필요할 가능성 있는 테이블이니 미리 만듦

  @ManyToOne(() => User, (user) => user.clouds, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: User;

  @OneToMany(() => Link, (link) => link.cloud, {
    onDelete: 'NO ACTION', // 클라우드에 있는 링크가 삭제되어도 클라우드는 제거되면 안 된다.
    onUpdate: 'CASCADE',
  })
  links!: Link[] | [];

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;
}
