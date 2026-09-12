import { FonteDados } from '../configuracao/banco';
import { PedidoTransfusao } from '../entidades/PedidoTransfusao';
import { Hemocentro } from '../entidades/Hemocentro';
import { Usuario } from '../entidades/Usuario';
import { StatusTransfusao } from '../utilitarios/status-transfusao.enum';

const repositorioPedido = () => FonteDados.getRepository(PedidoTransfusao);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);
const repositorioUsuario = () => FonteDados.getRepository(Usuario);

export class PedidoTransfusaoServico {
  async criar(dados: {
    idHemocentro: number;
    nomePaciente: string;
    tipoSanguinePaciente: string;
    idadePaciente: number;
    generoPaciente: string;
    numeroProntuario: string;
    diagnostico: string;
    tipoComponente: string;
    quantidadeSolicitada: number;
    nivelUrgencia: number;
    dataSolicitacao?: Date;
    precisaAte: Date;
    indicacaoClinica?: string;
    idReceptor?: number;
    contatoMedico?: string;
    observacoes?: string;
  }): Promise<PedidoTransfusao> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');

    let receptor: Usuario | null = null;
    if (dados.idReceptor) {
      receptor = await repositorioUsuario().findOne({ where: { id: dados.idReceptor } });
    }

    const pedido = repositorioPedido().create({
      hemocentro,
      nomePaciente: dados.nomePaciente,
      tipoSanguinePaciente: dados.tipoSanguinePaciente,
      idadePaciente: dados.idadePaciente,
      generoPaciente: dados.generoPaciente,
      numeroProntuario: dados.numeroProntuario,
      diagnostico: dados.diagnostico,
      tipoComponente: dados.tipoComponente,
      quantidadeSolicitada: dados.quantidadeSolicitada,
      nivelUrgencia: dados.nivelUrgencia,
      dataSolicitacao: dados.dataSolicitacao || new Date(),
      precisaAte: dados.precisaAte,
      indicacaoClinica: dados.indicacaoClinica,
      status: StatusTransfusao.PENDENTE,
      receptor,
      contatoMedico: dados.contatoMedico,
      observacoes: dados.observacoes,
    });

    return repositorioPedido().save(pedido);
  }

  async atualizar(id: number, dados: Partial<{
    nomePaciente: string;
    tipoSanguinePaciente: string;
    idadePaciente: number;
    generoPaciente: string;
    numeroProntuario: string;
    diagnostico: string;
    tipoComponente: string;
    quantidadeSolicitada: number;
    nivelUrgencia: number;
    precisaAte: Date;
    indicacaoClinica: string;
    contatoMedico: string;
    observacoes: string;
  }>): Promise<PedidoTransfusao> {
    const pedido = await repositorioPedido().findOne({ where: { id }, relations: ['hemocentro', 'receptor'] });
    if (!pedido) throw new Error('Pedido de transfusão não encontrado');

    if (dados.nomePaciente != null) pedido.nomePaciente = dados.nomePaciente;
    if (dados.tipoSanguinePaciente != null) pedido.tipoSanguinePaciente = dados.tipoSanguinePaciente;
    if (dados.idadePaciente != null) pedido.idadePaciente = dados.idadePaciente;
    if (dados.generoPaciente != null) pedido.generoPaciente = dados.generoPaciente;
    if (dados.numeroProntuario != null) pedido.numeroProntuario = dados.numeroProntuario;
    if (dados.diagnostico != null) pedido.diagnostico = dados.diagnostico;
    if (dados.tipoComponente != null) pedido.tipoComponente = dados.tipoComponente;
    if (dados.quantidadeSolicitada != null) pedido.quantidadeSolicitada = dados.quantidadeSolicitada;
    if (dados.nivelUrgencia != null) pedido.nivelUrgencia = dados.nivelUrgencia;
    if (dados.precisaAte != null) pedido.precisaAte = dados.precisaAte;
    if (dados.indicacaoClinica != null) pedido.indicacaoClinica = dados.indicacaoClinica;
    if (dados.contatoMedico != null) pedido.contatoMedico = dados.contatoMedico;
    if (dados.observacoes != null) pedido.observacoes = dados.observacoes;

    return repositorioPedido().save(pedido);
  }

  async actualizarStatus(id: number, status: StatusTransfusao): Promise<PedidoTransfusao> {
    const pedido = await repositorioPedido().findOne({ where: { id }, relations: ['hemocentro', 'receptor'] });
    if (!pedido) throw new Error('Pedido de transfusão não encontrado');
    pedido.status = status;
    return repositorioPedido().save(pedido);
  }

  async remover(id: number): Promise<void> {
    const pedido = await repositorioPedido().findOne({ where: { id } });
    if (!pedido) throw new Error('Pedido de transfusão não encontrado');
    await repositorioPedido().remove(pedido);
  }

  async buscarPorId(id: number): Promise<PedidoTransfusao> {
    const pedido = await repositorioPedido().findOne({ where: { id }, relations: ['hemocentro', 'receptor'] });
    if (!pedido) throw new Error('Pedido de transfusão não encontrado');
    return pedido;
  }

  async buscarTodos(): Promise<PedidoTransfusao[]> {
    return repositorioPedido().find({ relations: ['hemocentro', 'receptor'], order: { nivelUrgencia: 'ASC', criadoEm: 'DESC' } });
  }

  async buscarPorHemocentro(idHemocentro: number): Promise<PedidoTransfusao[]> {
    return repositorioPedido().find({
      where: { hemocentro: { id: idHemocentro } },
      relations: ['hemocentro', 'receptor'],
      order: { nivelUrgencia: 'ASC' },
    });
  }

  async buscarPorStatus(status: StatusTransfusao): Promise<PedidoTransfusao[]> {
    return repositorioPedido().find({
      where: { status },
      relations: ['hemocentro', 'receptor'],
      order: { nivelUrgencia: 'ASC', criadoEm: 'DESC' },
    });
  }

  async buscarPendentes(): Promise<PedidoTransfusao[]> {
    return this.buscarPorStatus(StatusTransfusao.PENDENTE);
  }

  async buscarPorReceptor(idReceptor: number): Promise<PedidoTransfusao[]> {
    return repositorioPedido().find({
      where: { receptor: { id: idReceptor } },
      relations: ['hemocentro', 'receptor'],
      order: { nivelUrgencia: 'DESC', criadoEm: 'DESC' },
    });
  }

  async buscarHistoricoReceptor(idReceptor: number): Promise<PedidoTransfusao[]> {
    return repositorioPedido().find({
      where: { receptor: { id: idReceptor }, status: StatusTransfusao.CONCLUIDA },
      relations: ['hemocentro', 'receptor'],
      order: { criadoEm: 'DESC' },
    });
  }
}

export const pedidoTransfusaoServico = new PedidoTransfusaoServico();
