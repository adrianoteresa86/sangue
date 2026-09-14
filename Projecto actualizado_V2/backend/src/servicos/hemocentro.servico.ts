import { FonteDados } from '../configuracao/banco';
import { Hemocentro } from '../entidades/Hemocentro';
import { AgendamentoDoacao } from '../entidades/AgendamentoDoacao';
import { EstoqueSangue } from '../entidades/EstoqueSangue';
import { PerfilHemocentro } from '../entidades/PerfilHemocentro';

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

    // Limpar perfis de usuários que já foram soft-deleted
    const perfisInativos = await FonteDados.getRepository(PerfilHemocentro)
      .createQueryBuilder('perfil')
      .innerJoin('perfil.usuario', 'usuario')
      .where('perfil.hemocenter_id = :id', { id })
      .andWhere('usuario.deletedAt IS NOT NULL')
      .getMany();
      
    if (perfisInativos.length > 0) {
      await FonteDados.getRepository(PerfilHemocentro).remove(perfisInativos);
    }

    const perfisAtivos = await FonteDados.getRepository(PerfilHemocentro)
      .createQueryBuilder('perfil')
      .innerJoin('perfil.usuario', 'usuario')
      .where('perfil.hemocenter_id = :id', { id })
      .andWhere('usuario.deletedAt IS NULL')
      .getCount();
    
    if (perfisAtivos > 0) throw new Error('Não é possível remover hemocentro com usuários (coordenadores/técnicos) associados');

    await repositorioHemocentro().remove(hemocentro);
  }

  async buscarPorId(id: number): Promise<Hemocentro> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');
    return hemocentro;
  }

  async buscarTodos(): Promise<any[]> {
    const hemocentros = await repositorioHemocentro().find({ order: { nome: 'ASC' } });
    
    // Obter todos os perfis de hemocentro com coordenadores ativos
    const perfisCoords = await FonteDados.getRepository(PerfilHemocentro).find({
      relations: ['usuario', 'hemocentro'],
      where: { usuario: { perfil: 'COORDENADOR_HEMOCENTRO' as any, ativo: true } }
    });
    
    const hemocentrosComCoord = new Set(perfisCoords.map(p => p.hemocentro.id));

    return hemocentros.map(h => ({
      ...h,
      temCoordenador: hemocentrosComCoord.has(h.id)
    }));
  }

  async buscarAtivos(): Promise<any[]> {
    const hemocentros = await repositorioHemocentro().find({ where: { ativo: true }, order: { nome: 'ASC' } });
    
    // Obter todos os perfis de hemocentro com coordenadores ativos
    const perfisCoords = await FonteDados.getRepository(PerfilHemocentro).find({
      relations: ['usuario', 'hemocentro'],
      where: { usuario: { perfil: 'COORDENADOR_HEMOCENTRO' as any, ativo: true } }
    });
    
    const hemocentrosComCoord = new Set(perfisCoords.map(p => p.hemocentro.id));

    return hemocentros.map(h => ({
      ...h,
      temCoordenador: hemocentrosComCoord.has(h.id)
    }));
  }
}

export const hemocentroServico = new HemocentroServico();
