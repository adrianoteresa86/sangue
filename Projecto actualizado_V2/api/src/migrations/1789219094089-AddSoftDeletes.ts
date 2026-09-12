import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeletes1789219094089 implements MigrationInterface {
    name = 'AddSoftDeletes1789219094089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hemocentros" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "campanhas" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "agendamentos_doacoes" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "estoque_sangue" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pedidos_transfusao" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pedidos_transfusao" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "estoque_sangue" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "agendamentos_doacoes" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "campanhas" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "hemocentros" DROP COLUMN "deleted_at"`);
    }

}
