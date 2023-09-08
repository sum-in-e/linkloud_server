import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1694144815853 implements MigrationInterface {
  name = 'file1694144815853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` DROP COLUMN \`is_read\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP COLUMN \`read_at\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` ADD \`read_at\` datetime NULL DEFAULT 'NULL'`);
    await queryRunner.query(`ALTER TABLE \`link\` ADD \`is_read\` tinyint NOT NULL DEFAULT '0'`);
  }
}
