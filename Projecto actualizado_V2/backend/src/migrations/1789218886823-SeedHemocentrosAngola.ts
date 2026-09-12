import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedHemocentrosAngola1789218886823 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hemocentros = [
            // Luanda - Centros de Referência
            { nome: 'Instituto Nacional de Sangue (INS) - Sede', endereco: 'Rua Kwame Nkrumah, nº 10, Maianga', cidade: 'Luanda', provincia: 'Luanda' },
            { nome: 'Instituto Hematológico Pediátrico Dra. Victória do Espírito Santo', endereco: 'Bairro da Maianga', cidade: 'Luanda', provincia: 'Luanda' },
            
            // Luanda - Hospitais Centrais
            { nome: 'Hospital Américo Boavida', endereco: 'Luanda', cidade: 'Luanda', provincia: 'Luanda' },
            { nome: 'Hospital Josina Machel', endereco: 'Luanda', cidade: 'Luanda', provincia: 'Luanda' },
            { nome: 'Complexo Hospitalar Cardeal Dom Alexandre do Nascimento', endereco: 'Luanda', cidade: 'Luanda', provincia: 'Luanda' },
            { nome: 'Hospital Geral de Luanda', endereco: 'Luanda', cidade: 'Luanda', provincia: 'Luanda' },
            { nome: 'Hospital do Prenda', endereco: 'Luanda', cidade: 'Luanda', provincia: 'Luanda' },
            
            // Região Norte
            { nome: 'Hospital Provincial do Uíge', endereco: 'Uíge', cidade: 'Uíge', provincia: 'Uíge' },
            { nome: 'Hospital Geral de Mbanza Kongo', endereco: 'Mbanza Kongo', cidade: 'Mbanza Kongo', provincia: 'Zaire' },
            { nome: 'Hospital Geral de Cabinda', endereco: 'Cabinda', cidade: 'Cabinda', provincia: 'Cabinda' },
            
            // Região Centro
            { nome: 'Hospital Geral de Benguela', endereco: 'Benguela', cidade: 'Benguela', provincia: 'Benguela' },
            { nome: 'Hospital Geral do Huambo', endereco: 'Huambo', cidade: 'Huambo', provincia: 'Huambo' },
            { nome: 'Hospital Regional de Malanje', endereco: 'Malanje', cidade: 'Malanje', provincia: 'Malanje' },
            
            // Região Sul
            { nome: 'Hospital Central do Lubango', endereco: 'Lubango', cidade: 'Lubango', provincia: 'Huíla' },
            { nome: 'Hospital Geral de Ondjiva', endereco: 'Ondjiva', cidade: 'Ondjiva', provincia: 'Cunene' },
            { nome: 'Hospital Geral de Moçâmedes', endereco: 'Moçâmedes', cidade: 'Moçâmedes', provincia: 'Namibe' },
            
            // Região Leste
            { nome: 'Hospital Geral do Luena', endereco: 'Luena', cidade: 'Luena', provincia: 'Moxico' },
            { nome: 'Hospital Geral de Saurimo', endereco: 'Saurimo', cidade: 'Saurimo', provincia: 'Lunda Sul' },
            { nome: 'Hospital Geral do Dundo', endereco: 'Dundo', cidade: 'Dundo', provincia: 'Lunda Norte' },
        ];

        for (const h of hemocentros) {
            await queryRunner.query(`
                INSERT INTO "hemocentros" (name, address, city, state, active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, true, NOW(), NOW())
            `, [h.nome, h.endereco, h.cidade, h.provincia]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We do not delete in down method because it might delete user-created hemocentros later,
        // but we can delete the seeded ones based on names.
        await queryRunner.query(`
            DELETE FROM "hemocentros" WHERE name IN (
                'Instituto Nacional de Sangue (INS) - Sede',
                'Instituto Hematológico Pediátrico Dra. Victória do Espírito Santo',
                'Hospital Américo Boavida',
                'Hospital Josina Machel',
                'Complexo Hospitalar Cardeal Dom Alexandre do Nascimento',
                'Hospital Geral de Luanda',
                'Hospital do Prenda',
                'Hospital Provincial do Uíge',
                'Hospital Geral de Mbanza Kongo',
                'Hospital Geral de Cabinda',
                'Hospital Geral de Benguela',
                'Hospital Geral do Huambo',
                'Hospital Regional de Malanje',
                'Hospital Central do Lubango',
                'Hospital Geral de Ondjiva',
                'Hospital Geral de Moçâmedes',
                'Hospital Geral do Luena',
                'Hospital Geral de Saurimo',
                'Hospital Geral do Dundo'
            )
        `);
    }

}
