import { FonteDados } from '../configuracao/banco';
import { RegistroTransfusao } from '../entidades/RegistroTransfusao';
import { PedidoTransfusao } from '../entidades/PedidoTransfusao';
import { Hemocentro } from '../entidades/Hemocentro';
import { EstoqueSangue } from '../entidades/EstoqueSangue';
import { Usuario } from '../entidades/Usuario';

const repositorioRegistro = () => FonteDados.getRepository(RegistroTransfusao);
const repositorioPedido = () => FonteDados.getRepository(PedidoTransfusao);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);
const repositorioEstoque = () => FonteDados.getRepository(EstoqueSangue);
const repositorioUsuario = () => FonteDados.getRepository(Usuario);

export class RegistroTransfusaoServico {
  async criar(dados: {
    idPedido: number;
    idHemocentro: number;
    idEstoqueSangue: number;
    dataTransfusao?: Date;
    horaInicio?: Date;
    horaFim?: Date;
    quantidadeAdministrada: number;
    tipoSangue: string;
    tipoComponente: string;
    prePressaoSistolica: number;
    prePressaoDiastolica: number;
    prePulso: number;
    preTemperatura: number;
    preFrequenciaRespiratoria: number;
    durantePressaoSistolica?: number;
    durantePressaoDiastolica?: number;
    durantePulso?: number;
    duranteTemperatura?: number;
    posPressaoSistolica?: number;
    posPressaoDiastolica?: number;
    posPulso?: number;
    posTemperatura?: number;
    posFrequenciaRespiratoria?: number;
    reacaoAdversa?: boolean;
    descricaoReacaoAdversa?: string;
    concluida?: boolean;
    complicacoes?: string;
    observacoes?: string;
    idEnfermeiro?: number;
    idMedico?: number;
    idReceptor?: number;
  }): Promise<RegistroTransfusao> {
    const pedido = await repositorioPedido().findOne({ where: { id: dados.idPedido } });
    if (!pedido) throw new Error('Pedido de transfusão não encontrado');

    const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');

    const estoqueSangue = await repositorioEstoque().findOne({ where: { id: dados.idEstoqueSangue } });
    if (!estoqueSangue) throw new Error('Estoque de sangue não encontrado');

    let enfermeiro: Usuario | null = null;
    if (dados.idEnfermeiro) enfermeiro = await repositorioUsuario().findOne({ where: { id: dados.idEnfermeiro } });

    let medico: Usuario | null = null;
    if (dados.idMedico) medico = await repositorioUsuario().findOne({ where: { id: dados.idMedico } });

    let receptor: Usuario | null = null;
    if (dados.idReceptor) receptor = await repositorioUsuario().findOne({ where: { id: dados.idReceptor } });

    const registro = repositorioRegistro().create({
      pedido,
      hemocentro,
      estoqueSangue,
      dataTransfusao: dados.dataTransfusao || new Date(),
      horaInicio: dados.horaInicio || new Date(),
      horaFim: dados.horaFim,
      quantidadeAdministrada: dados.quantidadeAdministrada,
      tipoSangue: dados.tipoSangue,
      tipoComponente: dados.tipoComponente,
      prePressaoSistolica: dados.prePressaoSistolica,
      prePressaoDiastolica: dados.prePressaoDiastolica,
      prePulso: dados.prePulso,
      preTemperatura: dados.preTemperatura,
      preFrequenciaRespiratoria: dados.preFrequenciaRespiratoria,
      durantePressaoSistolica: dados.durantePressaoSistolica,
      durantePressaoDiastolica: dados.durantePressaoDiastolica,
      durantePulso: dados.durantePulso,
      duranteTemperatura: dados.duranteTemperatura,
      posPressaoSistolica: dados.posPressaoSistolica,
      posPressaoDiastolica: dados.posPressaoDiastolica,
      posPulso: dados.posPulso,
      posTemperatura: dados.posTemperatura,
      posFrequenciaRespiratoria: dados.posFrequenciaRespiratoria,
      reacaoAdversa: dados.reacaoAdversa || false,
      descricaoReacaoAdversa: dados.descricaoReacaoAdversa,
      concluida: dados.concluida || false,
      complicacoes: dados.complicacoes,
      observacoes: dados.observacoes,
      enfermeiroResponsavel: enfermeiro,
      medicoSupervisor: medico,
      receptor,
    });

    return repositorioRegistro().save(registro);
  }

  async atualizar(id: number, dados: Partial<{
    quantidadeAdministrada: number;
    tipoSangue: string;
    tipoComponente: string;
    horaFim: Date;
    reacaoAdversa: boolean;
    descricaoReacaoAdversa: string;
    concluida: boolean;
    complicacoes: string;
    observacoes: string;
  }>): Promise<RegistroTransfusao> {
    const registro = await repositorioRegistro().findOne({ where: { id }, relations: ['pedido', 'hemocentro', 'estoqueSangue'] });
    if (!registro) throw new Error('Registro de transfusão não encontrado');

    const campos = [
      'quantidadeAdministrada', 'tipoSangue', 'tipoComponente', 'horaFim',
      'reacaoAdversa', 'descricaoReacaoAdversa', 'concluida', 'complicacoes', 'observacoes',
    ] as const;

    for (const campo of campos) {
      if (dados[campo] != null) (registro as any)[campo] = dados[campo];
    }

    return repositorioRegistro().save(registro);
  }

  async remover(id: number): Promise<void> {
    const registro = await repositorioRegistro().findOne({ where: { id } });
    if (!registro) throw new Error('Registro de transfusão não encontrado');
    await repositorioRegistro().remove(registro);
  }

  async buscarPorId(id: number): Promise<RegistroTransfusao> {
    const registro = await repositorioRegistro().findOne({
      where: { id },
      relations: ['pedido', 'hemocentro', 'estoqueSangue', 'enfermeiroResponsavel', 'medicoSupervisor', 'receptor'],
    });
    if (!registro) throw new Error('Registro de transfusão não encontrado');
    return registro;
  }

  async buscarTodos(): Promise<RegistroTransfusao[]> {
    return repositorioRegistro().find({ relations: ['pedido', 'hemocentro', 'estoqueSangue'], order: { dataTransfusao: 'DESC' } });
  }

  async buscarPorPedido(idPedido: number): Promise<RegistroTransfusao | null> {
    return repositorioRegistro().findOne({
      where: { pedido: { id: idPedido } },
      relations: ['pedido', 'hemocentro', 'estoqueSangue'],
    });
  }

  async buscarPorHemocentro(idHemocentro: number): Promise<RegistroTransfusao[]> {
    return repositorioRegistro().find({
      where: { hemocentro: { id: idHemocentro } },
      relations: ['pedido', 'hemocentro', 'estoqueSangue'],
      order: { dataTransfusao: 'DESC' },
    });
  }
}

export const registroTransfusaoServico = new RegistroTransfusaoServico();
