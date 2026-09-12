import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class ReceptorFeatures1746662400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela perfis_receptores
    await queryRunner.createTable(
      new Table({
        name: 'perfis_receptores',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'usuario_id', type: 'int', isNullable: false },
          { name: 'data_nascimento', type: 'date', isNullable: true },
          { name: 'tipo_sanguineo', type: 'varchar', length: '10', isNullable: true },
          { name: 'peso', type: 'double precision', isNullable: true },
          { name: 'altura', type: 'double precision', isNullable: true },
          { name: 'historico_medico', type: 'text', isNullable: true },
          { name: 'genero', type: 'varchar', length: '20', isNullable: true },
        ],
      }),
      true,
    );

    // await queryRunner.createForeignKey(
    //   'perfis_receptores',
    //   new TableForeignKey({
    //     columnNames: ['usuario_id'],
    //     referencedColumnNames: ['id'],
    //     referencedTableName: 'usuarios',
    //     onDelete: 'CASCADE',
    //   }),
    // );

    // Permitir hemocentro nulo em pedidos_transfusao (receptor pode não saber qual hemocentro)
    await queryRunner.query(
      `ALTER TABLE pedidos_transfusao ALTER COLUMN hemocenter_id DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE pedidos_transfusao ALTER COLUMN hemocenter_id SET NOT NULL`,
    );
    await queryRunner.dropTable('perfis_receptores');
  }
}
