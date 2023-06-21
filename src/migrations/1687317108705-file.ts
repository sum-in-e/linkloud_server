import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1687317108705 implements MigrationInterface {
  name = 'file1687317108705';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` CHANGE \`thumbnail_url\` \`thumbnail_url\` varchar(255) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`link\` CHANGE \`thumbnail_url\` \`thumbnail_url\` varchar(255) NULL DEFAULT 'NULL'`,
    );
  }
}
