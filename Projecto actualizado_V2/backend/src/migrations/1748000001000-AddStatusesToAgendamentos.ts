import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusesToAgendamentos1748000001000 implements MigrationInterface {
  name = 'AddStatusesToAgendamentos1748000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "agendamentos_doacoes_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED'`);
    await queryRunner.query(`ALTER TYPE "agendamentos_doacoes_status_enum" ADD VALUE IF NOT EXISTS 'IN_PROCESSING'`);
    await queryRunner.query(`ALTER TYPE "agendamentos_doacoes_status_enum" ADD VALUE IF NOT EXISTS 'REFUSED'`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL não suporta remover valores de um enum sem recriar o tipo.
    // Para reverter, seria necessário recriar a coluna com o tipo original.
  }
}
