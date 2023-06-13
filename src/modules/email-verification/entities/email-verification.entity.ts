import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, BeforeInsert } from 'typeorm';

@Entity()
export class EmailVerification extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true, // 해당 컬럼이 양수 값만 허용하도록 설정
  })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 6 })
  verificationCode!: string;

  @Column({ type: 'datetime' })
  expiredAt!: Date;

  @Column({ type: 'boolean', default: false }) // 이메일 인증 여부 컬럼
  isVerified!: boolean;

  @BeforeInsert() // 데이터를 저장하기 전에 실행할 메서드
  setExpiredAt() {
    const date = new Date(); // 현재 시간을 나타내는 Date 객체 생성
    date.setMinutes(date.getMinutes() + 10); // 데이터 저장되는 시간으로부터 10분 후 인증번호 만료 설정
    this.expiredAt = date; // expiredAt에 할당
  }
}
