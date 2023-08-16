import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1692200421938 implements MigrationInterface {
  name = 'file1692200421938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` MODIFY \`url\` varchar(1000) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`link\` MODIFY \`thumbnail_url\` varchar(1000) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` MODIFY \`thumbnail_url\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`link\` MODIFY \`url\` varchar(255) NOT NULL`);
  }
}
