import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerfilHemocentro1789217259115 implements MigrationInterface {
    name = 'AddPerfilHemocentro1789217259115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "perfil_hemocentro" ("id" SERIAL NOT NULL, "position" character varying(100), "user_id" integer, "hemocenter_id" integer NOT NULL, CONSTRAINT "REL_005d8759620590e82a7452f0da" UNIQUE ("user_id"), CONSTRAINT "PK_0313294164436ecbcfd5ef07095" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."usuarios_role_enum" RENAME TO "usuarios_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_role_enum" AS ENUM('DOADOR', 'ADMIN', 'RECEPTOR', 'FUNCIONARIO_HEMOCENTRO')`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "role" TYPE "public"."usuarios_role_enum" USING "role"::"text"::"public"."usuarios_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "perfil_hemocentro" ADD CONSTRAINT "FK_005d8759620590e82a7452f0da7" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "perfil_hemocentro" ADD CONSTRAINT "FK_d84c89b7c31376cae1341141750" FOREIGN KEY ("hemocenter_id") REFERENCES "hemocentros"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "perfil_hemocentro" DROP CONSTRAINT "FK_d84c89b7c31376cae1341141750"`);
        await queryRunner.query(`ALTER TABLE "perfil_hemocentro" DROP CONSTRAINT "FK_005d8759620590e82a7452f0da7"`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_role_enum_old" AS ENUM('ADMIN', 'DOADOR', 'RECEPTOR')`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "role" TYPE "public"."usuarios_role_enum_old" USING "role"::"text"::"public"."usuarios_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."usuarios_role_enum_old" RENAME TO "usuarios_role_enum"`);
        await queryRunner.query(`DROP TABLE "perfil_hemocentro"`);
    }

}
