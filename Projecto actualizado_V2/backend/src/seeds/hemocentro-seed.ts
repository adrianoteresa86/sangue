import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Hemocentro } from '../entidades/Hemocentro';
import { FonteDados } from '../configuracao/banco';

dotenv.config();

const hemocentrosData = [
  { nome: 'Instituto Nacional de Sangue (INS) - Sede', email: 'ins@sangue.ao', telefone: '923000001', endereco: 'Rua Kwame Nkrumah, nº 10, Maianga, Luanda', província: 'Luanda', capacidadeDiaria: 200, horarioFuncionamento: '08:00 - 18:00' },
  { nome: 'Instituto Hematológico Pediátrico Dra. Victória do Espírito Santo', email: 'pediatrico@sangue.ao', telefone: '923000002', endereco: 'Bairro da Maianga, Luanda', província: 'Luanda', capacidadeDiaria: 100, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital Américo Boavida', email: 'hab@sangue.ao', telefone: '923000003', endereco: 'Luanda', província: 'Luanda', capacidadeDiaria: 150, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital Josina Machel', email: 'hjm@sangue.ao', telefone: '923000004', endereco: 'Luanda', província: 'Luanda', capacidadeDiaria: 150, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Complexo Hospitalar Cardeal Dom Alexandre do Nascimento', email: 'chcdan@sangue.ao', telefone: '923000005', endereco: 'Luanda', província: 'Luanda', capacidadeDiaria: 200, horarioFuncionamento: '08:00 - 18:00' },
  { nome: 'Hospital Geral de Luanda', email: 'hgl@sangue.ao', telefone: '923000006', endereco: 'Luanda', província: 'Luanda', capacidadeDiaria: 100, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital do Prenda', email: 'prenda@sangue.ao', telefone: '923000007', endereco: 'Luanda', província: 'Luanda', capacidadeDiaria: 100, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital Provincial do Uíge', email: 'uige@sangue.ao', telefone: '923000008', endereco: 'Uíge', província: 'Uíge', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral de Mbanza Kongo', email: 'mbanzakongo@sangue.ao', telefone: '923000009', endereco: 'Mbanza Kongo, Zaire', província: 'Zaire', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral de Cabinda', email: 'cabinda@sangue.ao', telefone: '923000010', endereco: 'Cabinda', província: 'Cabinda', capacidadeDiaria: 80, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral de Benguela', email: 'benguela@sangue.ao', telefone: '923000011', endereco: 'Benguela', província: 'Benguela', capacidadeDiaria: 100, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital Geral do Huambo', email: 'huambo@sangue.ao', telefone: '923000012', endereco: 'Huambo', província: 'Huambo', capacidadeDiaria: 100, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital Regional de Malanje', email: 'malanje@sangue.ao', telefone: '923000013', endereco: 'Malanje', província: 'Malanje', capacidadeDiaria: 80, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Central do Lubango', email: 'lubango@sangue.ao', telefone: '923000014', endereco: 'Lubango, Huíla', província: 'Huíla', capacidadeDiaria: 120, horarioFuncionamento: '08:00 - 15:00' },
  { nome: 'Hospital Geral de Ondjiva', email: 'ondjiva@sangue.ao', telefone: '923000015', endereco: 'Ondjiva, Cunene', província: 'Cunene', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral de Moçâmedes', email: 'mocamedes@sangue.ao', telefone: '923000016', endereco: 'Moçâmedes, Namibe', província: 'Namibe', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral do Luena', email: 'luena@sangue.ao', telefone: '923000017', endereco: 'Luena, Moxico', província: 'Moxico', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral de Saurimo', email: 'saurimo@sangue.ao', telefone: '923000018', endereco: 'Saurimo, Lunda Sul', província: 'Lunda Sul', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' },
  { nome: 'Hospital Geral do Dundo', email: 'dundo@sangue.ao', telefone: '923000019', endereco: 'Dundo, Lunda Norte', província: 'Lunda Norte', capacidadeDiaria: 50, horarioFuncionamento: '08:00 - 14:00' }
];

async function seedHemocentros() {
  try {
    await FonteDados.initialize();
    console.log('Conectado à base de dados para inserção dos hemocentros...');
    
    const repositorio = FonteDados.getRepository(Hemocentro);
    
    for (const h of hemocentrosData) {
      const existe = await repositorio.findOneBy({ nome: h.nome });
      if (!existe) {
        const novo = repositorio.create({
          nome: h.nome,
          email: h.email,
          telefone: h.telefone,
          endereco: h.endereco,
          
          horarioFuncionamento: h.horarioFuncionamento,
          ativo: true, estado: h.província
        });
        await repositorio.save(novo);
        console.log(`Hemocentro inserido: ${h.nome}`);
      } else {
        console.log(`Hemocentro já existe: ${h.nome}`);
      }
    }
    
    console.log('Seed completo!');
  } catch (erro) {
    console.error('Erro ao inserir hemocentros:', erro);
  } finally {
    if (FonteDados.isInitialized) await FonteDados.destroy();
  }
}

seedHemocentros();
