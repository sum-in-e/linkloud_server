import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1694138930260 implements MigrationInterface {
  name = 'file1694138930260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` ADD \`click_count\` int NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE \`link\` ADD \`click_frequency\` float NULL`);
    await queryRunner.query(`ALTER TABLE \`link\` ADD \`last_clicked_at\` datetime NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`link\` DROP COLUMN \`last_clicked_at\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP COLUMN \`click_frequency\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP COLUMN \`click_count\``);
  }
}
