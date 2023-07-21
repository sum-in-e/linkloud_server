import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1689924417800 implements MigrationInterface {
  name = 'file1689924417800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`email_verification\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`verification_code\` varchar(6) NOT NULL, \`expired_at\` datetime NOT NULL, \`is_verified\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`subscription\` (\`id\` int NOT NULL AUTO_INCREMENT, \`endpoint\` text NOT NULL, \`keys\` json NOT NULL, \`user_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`name\` varchar(255) NOT NULL, \`method\` varchar(255) NOT NULL, \`is_inactive\` tinyint NOT NULL DEFAULT 0, \`inactived_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`last_login_at\` datetime NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`thumbnail_url\` varchar(255) NOT NULL, \`title\` text NOT NULL, \`description\` text NOT NULL, \`memo\` text NOT NULL, \`is_in_my_collection\` tinyint NOT NULL DEFAULT 0, \`is_read\` tinyint NOT NULL DEFAULT 0, \`read_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`kloud_id\` int UNSIGNED NULL, \`user_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`kloud\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`position\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`user_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`kakao_verication_info\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`sub\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_940d49a105d50bbd616be540013\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link\` ADD CONSTRAINT \`FK_cc70feed445e3443c5cfa0fc1ac\` FOREIGN KEY (\`kloud_id\`) REFERENCES \`kloud\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link\` ADD CONSTRAINT \`FK_da35233ec2bfaa121bb3540039b\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`kloud\` ADD CONSTRAINT \`FK_eee5bfddc34bc9f8e31314a4f2f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`kloud\` DROP FOREIGN KEY \`FK_eee5bfddc34bc9f8e31314a4f2f\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP FOREIGN KEY \`FK_da35233ec2bfaa121bb3540039b\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP FOREIGN KEY \`FK_cc70feed445e3443c5cfa0fc1ac\``);
    await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_940d49a105d50bbd616be540013\``);
    await queryRunner.query(`DROP TABLE \`kakao_verication_info\``);
    await queryRunner.query(`DROP TABLE \`kloud\``);
    await queryRunner.query(`DROP TABLE \`link\``);
    await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`subscription\``);
    await queryRunner.query(`DROP TABLE \`email_verification\``);
  }
}
