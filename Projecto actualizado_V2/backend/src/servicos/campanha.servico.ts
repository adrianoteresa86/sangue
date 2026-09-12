import { FonteDados } from '../configuracao/banco';
import { Campanha } from '../entidades/Campanha';
import { Hemocentro } from '../entidades/Hemocentro';

const repositorioCampanha = () => FonteDados.getRepository(Campanha);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);

export class CampanhaServico {
  async criar(dados: {
    titulo: string;
    descricao?: string;
    dataInicio: string;
    dataFim: string;
    tipoSanguineo?: string;
    metaDoacoes: number;
    idHemocentro: number;
    doacoesAtuais?: number;
  }): Promise<Campanha> {
    if (!dados.titulo || !dados.titulo.trim()) throw new Error('Título é obrigatório');
    if (!dados.dataInicio || !dados.dataFim) throw new Error('Datas de início e fim são obrigatórias');
    if (!dados.metaDoacoes || dados.metaDoacoes <= 0) throw new Error('Meta de doações deve ser positiva');
    if (dados.metaDoacoes > 500) throw new Error('Meta de doações não pode exceder 500');
    
    // Validação: doacoesAtuais não pode exceder metaDoacoes
    if (dados.doacoesAtuais !== undefined && dados.doacoesAtuais > dados.metaDoacoes) {
      throw new Error('Doações atuais não podem exceder a meta de doações');
    }
    if (dados.doacoesAtuais !== undefined && dados.doacoesAtuais > 500) {
      throw new Error('Doações atuais não podem exceder 500');
    }

    const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');
    const campanha = repositorioCampanha().create({
      titulo: dados.titulo,
      descricao: dados.descricao,
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim,
      tipoSanguineo: dados.tipoSanguineo,
      metaDoacoes: dados.metaDoacoes,
      hemocentro,
      doacoesAtuais: dados.doacoesAtuais ?? 0,
      ativo: true,
    });

    return repositorioCampanha().save(campanha);
  }

  async atualizar(id: number, dados: Partial<{
    titulo: string;
    descricao: string;
    dataInicio: string;
    dataFim: string;
    tipoSanguineo: string;
    metaDoacoes: number;
    ativo: boolean;
    doacoesAtuais?: number;
  }>): Promise<Campanha> {
    const campanha = await repositorioCampanha().findOne({ where: { id }, relations: ['hemocentro'] });
    if (!campanha) throw new Error('Campanha não encontrada');

    // Validação: doacoesAtuais não pode exceder metaDoacoes
    if (dados.doacoesAtuais !== undefined && dados.metaDoacoes !== undefined) {
      if (dados.doacoesAtuais > dados.metaDoacoes) {
        throw new Error('Doações atuais não podem exceder a meta de doações');
      }
    } else if (dados.doacoesAtuais !== undefined && dados.doacoesAtuais > campanha.metaDoacoes) {
      throw new Error('Doações atuais não podem exceder a meta de doações');
    } else if (dados.metaDoacoes !== undefined && campanha.doacoesAtuais > dados.metaDoacoes) {
      throw new Error('Meta de doações não pode ser menor que as doações atuais');
    }
    
    // Validação: limite máximo de 500
    if (dados.metaDoacoes !== undefined && dados.metaDoacoes > 500) {
      throw new Error('Meta de doações não pode exceder 500');
    }
    if (dados.doacoesAtuais !== undefined && dados.doacoesAtuais > 500) {
      throw new Error('Doações atuais não podem exceder 500');
    }

    if (dados.titulo != null) campanha.titulo = dados.titulo;
    if (dados.descricao != null) campanha.descricao = dados.descricao;
    if (dados.dataInicio != null) campanha.dataInicio = dados.dataInicio;
    if (dados.dataFim != null) campanha.dataFim = dados.dataFim;
    if (dados.tipoSanguineo !== undefined) campanha.tipoSanguineo = dados.tipoSanguineo;
    if (dados.metaDoacoes != null) campanha.metaDoacoes = dados.metaDoacoes;
    if (dados.doacoesAtuais != null) campanha.doacoesAtuais = dados.doacoesAtuais;
    if (dados.ativo != null) campanha.ativo = dados.ativo;

    return repositorioCampanha().save(campanha);
  }

  async remover(id: number): Promise<void> {
    const campanha = await repositorioCampanha().findOne({ where: { id } });
    if (!campanha) throw new Error('Campanha não encontrada');
    await repositorioCampanha().remove(campanha);
  }

  async buscarPorId(id: number): Promise<Campanha> {
    const campanha = await repositorioCampanha().findOne({ where: { id }, relations: ['hemocentro'] });
    if (!campanha) throw new Error('Campanha não encontrada');
    return campanha;
  }

  async buscarTodas(): Promise<Campanha[]> {
    return repositorioCampanha().find({ relations: ['hemocentro'], order: { criadoEm: 'DESC' } });
  }

  async buscarAtivas(): Promise<Campanha[]> {
    return repositorioCampanha().find({ where: { ativo: true }, relations: ['hemocentro'], order: { dataInicio: 'DESC' } });
  }

  async buscarPorHemocentro(idHemocentro: number): Promise<Campanha[]> {
    return repositorioCampanha().find({
      where: { hemocentro: { id: idHemocentro } },
      relations: ['hemocentro'],
      order: { criadoEm: 'DESC' },
    });
  }

  async incrementarDoacao(idCampanha: number): Promise<void> {
    const campanha = await repositorioCampanha().findOne({ where: { id: idCampanha } });
    if (!campanha) throw new Error('Campanha não encontrada');
    
    // Validação: não pode exceder a meta
    if (campanha.doacoesAtuais >= campanha.metaDoacoes) {
      throw new Error('Meta de doações já foi alcançada. Não é possível adicionar mais doações.');
    }
    
    campanha.doacoesAtuais += 1;
    await repositorioCampanha().save(campanha);
  }
}

export const campanhaServico = new CampanhaServico();
