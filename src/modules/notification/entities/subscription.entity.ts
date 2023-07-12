import { User } from 'src/modules/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  endpoint!: string; //푸시 서비스의 URL

  @Column('json')
  keys!: {
    auth: string; // 공유 암호화 키 (Shared secret encryption key)를 위한 문자열. 이 키는 클라이언트와 서버 사이에서 푸시 메시지 내용을 안전하게 암호화하는 데 사용한다.
    p256dh: string; // 공개 키 암호화에 사용되는 클라이언트의 공개키. 서버가 클라이언트의 auth 키를 알지 못해도 안전하게 푸시 메시지를 암호화하는 데 사용된다.
  };

  @ManyToOne(() => User, (user) => user.links, {
    onDelete: 'CASCADE', // 유저가 삭제될 때, 해당 유저를 참조하고 있는 구독도 함께 삭제된다.
    onUpdate: 'CASCADE',
  })
  user!: User;
}
