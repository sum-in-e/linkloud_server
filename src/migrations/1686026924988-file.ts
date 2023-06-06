import { MigrationInterface, QueryRunner } from 'typeorm';

export class file1686026924988 implements MigrationInterface {
  name = 'file1686026924988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`name\` varchar(255) NOT NULL, \`method\` varchar(255) NOT NULL, \`is_inactive\` tinyint NOT NULL DEFAULT 0, \`inactived_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`last_login_at\` datetime NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`link\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`thumbnail_url\` varchar(255) NULL, \`title\` text NOT NULL, \`description\` text NOT NULL, \`memo\` text NOT NULL, \`test\` text NOT NULL, \`is_in_my_collection\` tinyint NOT NULL DEFAULT 0, \`is_read\` tinyint NOT NULL DEFAULT 0, \`read_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`cloud_id\` int UNSIGNED NULL, \`user_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cloud\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`position\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`user_id\` int UNSIGNED NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`kakao_verication_info\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`sub\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`email_verification\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`verification_code\` varchar(6) NOT NULL, \`expired_at\` datetime NOT NULL, \`is_verified\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link\` ADD CONSTRAINT \`FK_8bb43bb8c5bda9f3db7e9b83bdb\` FOREIGN KEY (\`cloud_id\`) REFERENCES \`cloud\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`link\` ADD CONSTRAINT \`FK_da35233ec2bfaa121bb3540039b\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cloud\` ADD CONSTRAINT \`FK_33262a12862377d7a07b7a078ee\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`cloud\` DROP FOREIGN KEY \`FK_33262a12862377d7a07b7a078ee\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP FOREIGN KEY \`FK_da35233ec2bfaa121bb3540039b\``);
    await queryRunner.query(`ALTER TABLE \`link\` DROP FOREIGN KEY \`FK_8bb43bb8c5bda9f3db7e9b83bdb\``);
    await queryRunner.query(`DROP TABLE \`email_verification\``);
    await queryRunner.query(`DROP TABLE \`kakao_verication_info\``);
    await queryRunner.query(`DROP TABLE \`cloud\``);
    await queryRunner.query(`DROP TABLE \`link\``);
    await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
