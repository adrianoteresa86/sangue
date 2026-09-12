import { FonteDados } from '../configuracao/banco';
import { Hemocentro } from '../entidades/Hemocentro';
import { AgendamentoDoacao } from '../entidades/AgendamentoDoacao';
import { EstoqueSangue } from '../entidades/EstoqueSangue';

const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);

export class HemocentroServico {
  async criar(dados: Partial<Hemocentro>): Promise<Hemocentro> {
    if (!dados.nome || !dados.nome.trim()) throw new Error('Nome é obrigatório');
    const hemocentro = repositorioHemocentro().create(dados);
    return repositorioHemocentro().save(hemocentro);
  }

  async atualizar(id: number, dados: Partial<Hemocentro>): Promise<Hemocentro> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');
    Object.assign(hemocentro, dados);
    return repositorioHemocentro().save(hemocentro);
  }

  async remover(id: number): Promise<void> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');

    const agendamentos = await FonteDados.getRepository(AgendamentoDoacao).count({ where: { hemocentro: { id } } });
    if (agendamentos > 0) throw new Error('Não é possível remover hemocentro com agendamentos existentes');

    const estoque = await FonteDados.getRepository(EstoqueSangue).count({ where: { hemocentro: { id } } });
    if (estoque > 0) throw new Error('Não é possível remover hemocentro com estoque de sangue existente');

    await repositorioHemocentro().remove(hemocentro);
  }

  async buscarPorId(id: number): Promise<Hemocentro> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');
    return hemocentro;
  }

  async buscarTodos(): Promise<Hemocentro[]> {
    return repositorioHemocentro().find({ order: { nome: 'ASC' } });
  }

  async buscarAtivos(): Promise<Hemocentro[]> {
    return repositorioHemocentro().find({ where: { ativo: true }, order: { nome: 'ASC' } });
  }
}

export const hemocentroServico = new HemocentroServico();
