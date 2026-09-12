import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorPerfilHemocentro1789218640380 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Renomear o enum actual para algo temporário
        await queryRunner.query(`ALTER TYPE "public"."usuarios_role_enum" RENAME TO "usuarios_role_enum_old"`);
        
        // Criar o novo enum com os novos valores
        await queryRunner.query(`CREATE TYPE "public"."usuarios_role_enum" AS ENUM('DOADOR', 'ADMIN', 'RECEPTOR', 'COORDENADOR_HEMOCENTRO', 'TECNICO_HEMOCENTRO')`);
        
        // Alterar a coluna para o novo enum, e converter FUNCIONARIO_HEMOCENTRO para COORDENADOR_HEMOCENTRO
        await queryRunner.query(`
            ALTER TABLE "usuarios" 
            ALTER COLUMN "role" TYPE "public"."usuarios_role_enum" 
            USING (
                CASE "role"::text
                    WHEN 'FUNCIONARIO_HEMOCENTRO' THEN 'COORDENADOR_HEMOCENTRO'::text
                    ELSE "role"::text
                END
            )::"public"."usuarios_role_enum"
        `);
        
        // Dropar o enum antigo
        await queryRunner.query(`DROP TYPE "public"."usuarios_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."usuarios_role_enum_old" AS ENUM('DOADOR', 'ADMIN', 'RECEPTOR', 'FUNCIONARIO_HEMOCENTRO')`);
        
        await queryRunner.query(`
            ALTER TABLE "usuarios" 
            ALTER COLUMN "role" TYPE "public"."usuarios_role_enum_old" 
            USING (
                CASE "role"::text
                    WHEN 'COORDENADOR_HEMOCENTRO' THEN 'FUNCIONARIO_HEMOCENTRO'::text
                    WHEN 'TECNICO_HEMOCENTRO' THEN 'FUNCIONARIO_HEMOCENTRO'::text
                    ELSE "role"::text
                END
            )::"public"."usuarios_role_enum_old"
        `);
        
        await queryRunner.query(`DROP TYPE "public"."usuarios_role_enum"`);
        
        await queryRunner.query(`ALTER TYPE "public"."usuarios_role_enum_old" RENAME TO "usuarios_role_enum"`);
    }

}
