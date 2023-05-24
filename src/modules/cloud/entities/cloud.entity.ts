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

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'int' })
  position!: number;

  @ManyToOne(() => User, (user) => user.clouds, {
    onDelete: 'CASCADE', // 유저가 삭제될 때, 해당 유저를 참조하고 있는 클라우드도 함께 삭제된다.
    onUpdate: 'CASCADE',
  })
  user!: User;

  @OneToMany(() => Link, (link) => link.cloud, {
    onDelete: 'CASCADE', // 클라우드가 삭제될 때 연결된 링크도 삭제
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
