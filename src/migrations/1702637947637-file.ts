import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1702637947637 implements MigrationInterface {
  name = 'file1702637947637';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`link\` CHANGE \`is_in_my_collection\` \`is_following\` tinyint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`is_inactive\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`inactived_at\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` ADD \`inactived_at\` datetime NULL DEFAULT 'NULL'`);
    await queryRunner.query(`ALTER TABLE \`user\` ADD \`is_inactive\` tinyint NOT NULL DEFAULT '0'`);
    await queryRunner.query(
      `ALTER TABLE \`link\` CHANGE \`is_following\` \`is_in_my_collection\` tinyint NOT NULL DEFAULT '0'`,
    );
  }
}
