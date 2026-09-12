import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddStatusToEstoqueSangue1737668800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // A coluna já existe no banco, pulando...
        // await queryRunner.addColumn(
        //     "estoque_sangue",
        //     new TableColumn({
        //         name: "status",
        //         type: "enum",
        //         enum: ["Adequado", "Baixo", "Crítico"],
        //         default: "'Adequado'",
        //         isNullable: false
        //     })
        // );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("estoque_sangue", "status");
    }
}
