import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExistingStockStatus1737668900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Atualizar todos os registros existentes com base nas regras médicas
        await queryRunner.query(`
            UPDATE estoque_sangue 
            SET status = CASE
                -- Regra 1: Se já venceu -> CRÍTICO
                WHEN expiration_date < CURRENT_DATE THEN 'Crítico'::estoque_sangue_status_enum
                
                -- Regra 2: Plaquetas vencendo em 5 dias -> BAIXO
                WHEN LOWER(component_type) LIKE '%plaquet%' 
                AND expiration_date <= (CURRENT_DATE + INTERVAL '5 days') 
                AND expiration_date >= CURRENT_DATE THEN 'Baixo'::estoque_sangue_status_enum
                
                -- Regra 3: Plasma vencendo em 30 dias -> BAIXO
                WHEN LOWER(component_type) LIKE '%plasma%' 
                AND expiration_date <= (CURRENT_DATE + INTERVAL '30 days') 
                AND expiration_date >= CURRENT_DATE THEN 'Baixo'::estoque_sangue_status_enum
                
                -- Regra 4: Sangue/Hemácias vencendo em 7 dias -> BAIXO
                WHEN (LOWER(component_type) LIKE '%sangue%' OR LOWER(component_type) LIKE '%hemác%') 
                AND expiration_date <= (CURRENT_DATE + INTERVAL '7 days') 
                AND expiration_date >= CURRENT_DATE THEN 'Baixo'::estoque_sangue_status_enum
                
                -- Regra 5: Quantidade <= 200ml -> CRÍTICO
                WHEN quantity <= 200 THEN 'Crítico'::estoque_sangue_status_enum
                
                -- Regra 6: Quantidade <= 500ml -> BAIXO
                WHEN quantity <= 500 THEN 'Baixo'::estoque_sangue_status_enum
                
                -- Regra 7: Caso contrário -> ADEQUADO
                ELSE 'Adequado'::estoque_sangue_status_enum
            END::estoque_sangue_status_enum
        `);
        
        // Verificar quantos registros foram atualizados
        const result = await queryRunner.query(`
            SELECT COUNT(*) as updated_count 
            FROM estoque_sangue 
            WHERE status IN ('Adequado', 'Baixo', 'Crítico')
        `);
        
        console.log(`Status atualizados para ${result[0].updated_count} registros de estoque`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter para status padrão
        await queryRunner.query(`
            UPDATE estoque_sangue 
            SET status = 'Adequado'::estoque_sangue_status_enum
        `);
    }
}
