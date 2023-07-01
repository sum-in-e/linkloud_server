import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1688178246170 implements MigrationInterface {
  name = 'file1688178246170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` DROP COLUMN \`test\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` ADD \`test\` text NOT NULL`);
  }
}
