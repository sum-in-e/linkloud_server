import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity()
export class KakaoVericationInfo extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number;

  @Column({ type: 'varchar' })
  sub!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;
}
