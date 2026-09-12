import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeneroToPerfilDoador1746750000000 implements MigrationInterface {
  name = 'AddGeneroToPerfilDoador1746750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "perfis_doadores" ADD COLUMN IF NOT EXISTS "genero" VARCHAR(20)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "perfis_doadores" DROP COLUMN IF EXISTS "genero"`);
  }
}
