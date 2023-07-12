import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1688999401236 implements MigrationInterface {
  name = 'file1688999401236';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`subscription\` (\`id\` int NOT NULL AUTO_INCREMENT, \`endpoint\` text NOT NULL, \`keys\` json NOT NULL, \`user_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_940d49a105d50bbd616be540013\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_940d49a105d50bbd616be540013\``);
    await queryRunner.query(`DROP TABLE \`subscription\``);
  }
}
