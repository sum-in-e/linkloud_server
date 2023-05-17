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

  @Column({ type: 'int', default: 0 })
  position!: number;

  @ManyToOne(() => User, (user) => user.clouds, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: User;

  @OneToMany(() => Link, (link) => link.cloud, {
    onDelete: 'SET NULL', // 클라우드에 있는 링크가 삭제되어도 클라우드는 제거되면 안 된다. NO ACTION은 존재하지 않는 링크를 참조하게 될 수 있기 때문에 null로 변하게 해야한다.
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
