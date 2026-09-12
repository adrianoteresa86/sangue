import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';
import { PerfilReceptor } from '../entidades/PerfilReceptor';
import { PedidoTransfusao } from '../entidades/PedidoTransfusao';
import { Hemocentro } from '../entidades/Hemocentro';
import { Notificacao } from '../entidades/Notificacao';
import { StatusTransfusao } from '../utilitarios/status-transfusao.enum';

const repositorioUsuario = () => FonteDados.getRepository(Usuario);
const repositorioPerfil = () => FonteDados.getRepository(PerfilReceptor);
const repositorioPedido = () => FonteDados.getRepository(PedidoTransfusao);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);
const repositorioNotificacao = () => FonteDados.getRepository(Notificacao);

const STATUS_ATIVOS = [StatusTransfusao.PENDENTE, StatusTransfusao.APROVADA, StatusTransfusao.EM_ANDAMENTO];

const MAPA_URGENCIA: Record<string, number> = {
  normal: 1,
  media: 2,
  urgente: 3,
  critica: 4,
};

function gerarNumeroProntuario(): string {
  const ano = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `REC-${ano}-${seq}`;
}

export class ReceptorServico {
  async obterPerfil(idUsuario: number): Promise<{ usuario: Usuario; perfilReceptor: PerfilReceptor | null }> {
    const usuario = await repositorioUsuario().findOne({
      where: { id: idUsuario },
      relations: ['perfilReceptor'],
    });
    if (!usuario) throw new Error('Utilizador não encontrado');

    return { usuario, perfilReceptor: usuario.perfilReceptor ?? null };
  }

  async atualizarPerfil(
    idUsuario: number,
    dados: {
      nome?: string;
      email?: string;
      telefone?: string;
      rua?: string;
      numero?: string;
      bairro?: string;
      provincia?: string;
      dataNascimento?: Date;
      tipoSanguineo?: string;
      peso?: number;
      altura?: number;
      historicoMedico?: string;
      genero?: string;
    },
  ): Promise<{ usuario: Usuario; perfilReceptor: PerfilReceptor }> {
    const usuario = await repositorioUsuario().findOne({
      where: { id: idUsuario },
      relations: ['perfilReceptor'],
    });
    if (!usuario) throw new Error('Utilizador não encontrado');

    if (dados.nome?.trim()) usuario.nome = dados.nome;
    if (dados.email?.trim()) usuario.email = dados.email;
    if (dados.telefone?.trim()) usuario.telefone = dados.telefone;
    if (dados.rua?.trim()) usuario.rua = dados.rua;
    if (dados.numero?.trim()) usuario.numero = dados.numero;
    if (dados.bairro?.trim()) usuario.bairro = dados.bairro;
    if (dados.provincia?.trim()) usuario.provincia = dados.provincia;
    await repositorioUsuario().save(usuario);

    let perfil = usuario.perfilReceptor;
    if (!perfil) {
      perfil = repositorioPerfil().create({ usuario });
    }

    if (dados.dataNascimento != null) perfil.dataNascimento = dados.dataNascimento;
    if (dados.tipoSanguineo?.trim()) perfil.tipoSanguineo = dados.tipoSanguineo;
    if (dados.peso != null) perfil.peso = dados.peso;
    if (dados.altura != null) perfil.altura = dados.altura;
    if (dados.historicoMedico != null) perfil.historicoMedico = dados.historicoMedico;
    if (dados.genero?.trim()) perfil.genero = dados.genero;

    await repositorioPerfil().save(perfil);
    return { usuario, perfilReceptor: perfil };
  }

  async dashboard(idUsuario: number) {
    const usuario = await repositorioUsuario().findOne({
      where: { id: idUsuario },
      relations: ['perfilReceptor'],
    });
    if (!usuario) throw new Error('Utilizador não encontrado');

    const todosPedidos = await repositorioPedido().find({
      where: { receptor: { id: idUsuario } },
      order: { criadoEm: 'DESC' },
    });

    const anoAtual = new Date().getFullYear();

    const ativos = todosPedidos.filter((p) => STATUS_ATIVOS.includes(p.status)).length;
    const concluidas = todosPedidos.filter(
      (p) => p.status === StatusTransfusao.CONCLUIDA && new Date(p.criadoEm).getFullYear() === anoAtual,
    ).length;
    const canceladas = todosPedidos.filter(
      (p) => p.status === StatusTransfusao.CANCELADA && new Date(p.criadoEm).getFullYear() === anoAtual,
    ).length;

    const recentes = await repositorioPedido().find({
      where: { receptor: { id: idUsuario } },
      relations: ['hemocentro'],
      order: { criadoEm: 'DESC' },
      take: 5,
    });

    return {
      ativos,
      concluidas,
      canceladas,
      tipoSanguineo: usuario.perfilReceptor?.tipoSanguineo ?? null,
      recentes,
    };
  }

  async meusPedidos(idUsuario: number): Promise<PedidoTransfusao[]> {
    return repositorioPedido().find({
      where: { receptor: { id: idUsuario } },
      relations: ['hemocentro'],
      order: { criadoEm: 'DESC' },
    });
  }

  async criarPedidoSimplificado(
    idUsuario: number,
    dados: {
      tipoSangue: string;
      volume: number;
      urgencia: string;
      motivo: string;
      observacoes?: string;
      idHemocentro?: number;
      precisaAte?: Date;
      urlDocumentoAutorizacao?: string;
    },
  ): Promise<PedidoTransfusao> {
    const usuario = await repositorioUsuario().findOne({
      where: { id: idUsuario },
      relations: ['perfilReceptor'],
    });
    if (!usuario) throw new Error('Utilizador não encontrado');

    let hemocentro: Hemocentro | null = null;
    if (dados.idHemocentro) {
      hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
      if (!hemocentro) throw new Error('Hemocentro não encontrado');
    }

    const nivelUrgencia = MAPA_URGENCIA[dados.urgencia?.toLowerCase()] ?? 1;
    const precisaAte = dados.precisaAte ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    let idadePaciente = 0;
    if (usuario.perfilReceptor?.dataNascimento) {
      const nascimento = new Date(usuario.perfilReceptor.dataNascimento);
      idadePaciente = new Date().getFullYear() - nascimento.getFullYear();
    }

    const pedido = repositorioPedido().create({
      hemocentro,
      nomePaciente: usuario.nome || 'Não informado',
      tipoSanguinePaciente: dados.tipoSangue,
      idadePaciente,
      generoPaciente: usuario.perfilReceptor?.genero || 'N/A',
      numeroProntuario: gerarNumeroProntuario(),
      diagnostico: dados.motivo,
      tipoComponente: 'Sangue Total',
      quantidadeSolicitada: dados.volume,
      nivelUrgencia,
      dataSolicitacao: new Date(),
      precisaAte,
      status: StatusTransfusao.PENDENTE,
      receptor: usuario,
      observacoes: dados.observacoes,
      urlDocumentoAutorizacao: dados.urlDocumentoAutorizacao,
    });

    return repositorioPedido().save(pedido);
  }

  async cancelarPedido(idUsuario: number, idPedido: number): Promise<PedidoTransfusao> {
    const pedido = await repositorioPedido().findOne({
      where: { id: idPedido },
      relations: ['receptor'],
    });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.receptor?.id !== idUsuario) throw new Error('Sem permissão para cancelar este pedido');
    if (pedido.status !== StatusTransfusao.PENDENTE) {
      throw new Error('Só é possível cancelar pedidos com status Pendente');
    }

    pedido.status = StatusTransfusao.CANCELADA;
    return repositorioPedido().save(pedido);
  }

  async historico(idUsuario: number) {
    const pedidos = await repositorioPedido().find({
      where: { receptor: { id: idUsuario }, status: StatusTransfusao.CONCLUIDA },
      relations: ['hemocentro'],
      order: { criadoEm: 'DESC' },
    });

    const anoAtual = new Date().getFullYear();
    const totalVolume = pedidos.reduce((soma, p) => soma + (p.quantidadeSolicitada || 0), 0);
    const esteAno = pedidos.filter((p) => new Date(p.criadoEm).getFullYear() === anoAtual).length;

    return {
      total: pedidos.length,
      totalLitros: +(totalVolume / 1000).toFixed(2),
      esteAno,
      transfusoes: pedidos,
    };
  }

  async obterPedido(idUsuario: number, idPedido: number): Promise<PedidoTransfusao> {
    const pedido = await repositorioPedido().findOne({
      where: { id: idPedido },
      relations: ['hemocentro', 'receptor'],
    });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.receptor?.id !== idUsuario) throw new Error('Sem permissão para ver este pedido');
    return pedido;
  }

  async atualizarPedido(
    idUsuario: number,
    idPedido: number,
    dados: {
      tipoSangue?: string;
      volume?: number;
      urgencia?: string;
      motivo?: string;
      observacoes?: string;
      idHemocentro?: number;
      precisaAte?: Date;
    },
  ): Promise<PedidoTransfusao> {
    const pedido = await repositorioPedido().findOne({
      where: { id: idPedido },
      relations: ['hemocentro', 'receptor'],
    });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.receptor?.id !== idUsuario) throw new Error('Sem permissão para editar este pedido');
    if (pedido.status !== StatusTransfusao.PENDENTE) throw new Error('Só é possível editar pedidos com status Pendente');

    if (dados.tipoSangue?.trim()) pedido.tipoSanguinePaciente = dados.tipoSangue;
    if (dados.volume != null) pedido.quantidadeSolicitada = dados.volume;
    if (dados.urgencia) pedido.nivelUrgencia = MAPA_URGENCIA[dados.urgencia.toLowerCase()] ?? pedido.nivelUrgencia;
    if (dados.motivo?.trim()) pedido.diagnostico = dados.motivo;
    if (dados.observacoes != null) pedido.observacoes = dados.observacoes;
    if (dados.precisaAte) pedido.precisaAte = dados.precisaAte;

    if (dados.idHemocentro != null) {
      const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
      if (!hemocentro) throw new Error('Hemocentro não encontrado');
      pedido.hemocentro = hemocentro;
    }

    return repositorioPedido().save(pedido);
  }

  async listarHemocentros(): Promise<Hemocentro[]> {
    return repositorioHemocentro().find({ where: { ativo: true }, order: { nome: 'ASC' } });
  }

  async listarNotificacoes(idUsuario: number) {
    const [notificacoes, naoLidas] = await Promise.all([
      repositorioNotificacao().find({
        where: { destinatario: { id: idUsuario } },
        order: { criadoEm: 'DESC' },
      }),
      repositorioNotificacao().count({
        where: { destinatario: { id: idUsuario }, lida: false },
      }),
    ]);
    return { total: notificacoes.length, naoLidas, notificacoes };
  }

  async marcarNotificacaoLida(idUsuario: number, idNotificacao: number): Promise<Notificacao> {
    const notificacao = await repositorioNotificacao().findOne({
      where: { id: idNotificacao },
      relations: ['destinatario'],
    });
    if (!notificacao) throw new Error('Notificação não encontrada');
    if (notificacao.destinatario.id !== idUsuario) throw new Error('Sem permissão para esta notificação');

    notificacao.lida = true;
    notificacao.lidaEm = new Date();
    return repositorioNotificacao().save(notificacao);
  }

  async marcarTodasNotificacoesLidas(idUsuario: number): Promise<void> {
    await repositorioNotificacao()
      .createQueryBuilder()
      .update(Notificacao)
      .set({ lida: true, lidaEm: new Date() })
      .where('user_id = :idUsuario AND is_read = false', { idUsuario })
      .execute();
  }
}

export const receptorServico = new ReceptorServico();
