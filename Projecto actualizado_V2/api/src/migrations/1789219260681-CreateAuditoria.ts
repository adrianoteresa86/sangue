import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditoria1789219260681 implements MigrationInterface {
    name = 'CreateAuditoria1789219260681'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auditorias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "acao" character varying NOT NULL, "entidade" character varying NOT NULL, "detalhes" jsonb, "usuario_id" integer, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b84b3505f313ab1a44e7b684ee2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "auditorias" ADD CONSTRAINT "FK_31216ed3bb88f7c6b2407d6d7dc" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auditorias" DROP CONSTRAINT "FK_31216ed3bb88f7c6b2407d6d7dc"`);
        await queryRunner.query(`DROP TABLE "auditorias"`);
    }

}
