import { FonteDados } from '../configuracao/banco';
import { RegistroDoacao } from '../entidades/RegistroDoacao';
import { Usuario } from '../entidades/Usuario';
import { Hemocentro } from '../entidades/Hemocentro';
import { AgendamentoDoacao } from '../entidades/AgendamentoDoacao';
import { StatusDoacao } from '../utilitarios/status-doacao.enum';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';
import { notificacaoServico } from './notificacao.servico';

const repositorioRegistro = () => FonteDados.getRepository(RegistroDoacao);
const repositorioUsuario = () => FonteDados.getRepository(Usuario);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);
const repositorioAgendamento = () => FonteDados.getRepository(AgendamentoDoacao);

export class RegistroDoacaoServico {
  async criar(dados: {
    idDoador: number;
    idHemocentro: number;
    idAgendamento?: number;
    dataDoacao?: Date;
    quantidade: number;
    tipoSangue: string;
    tipoComponente: string;
    nivelHemoglobina: number;
    pressaoSistolica: number;
    pressaoDiastolica: number;
    pulso: number;
    temperatura: number;
    peso: number;
    observacoes?: string;
    elegivel?: boolean;
    motivoInelegibilidade?: string;
    idTecnico?: number;
  }): Promise<RegistroDoacao> {
    const doador = await repositorioUsuario().findOne({ where: { id: dados.idDoador } });
    if (!doador) throw new Error('Doador não encontrado');

    const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');

    let agendamento: AgendamentoDoacao | null = null;
    if (dados.idAgendamento) {
      agendamento = await repositorioAgendamento().findOne({ where: { id: dados.idAgendamento } });
    }

    let tecnico: Usuario | null = null;
    if (dados.idTecnico) {
      tecnico = await repositorioUsuario().findOne({ where: { id: dados.idTecnico } });
    }

    const registro = repositorioRegistro().create({
      doador,
      hemocentro,
      agendamento,
      dataDoacao: dados.dataDoacao || new Date(),
      quantidade: dados.quantidade,
      tipoSangue: dados.tipoSangue,
      tipoComponente: dados.tipoComponente,
      nivelHemoglobina: dados.nivelHemoglobina,
      pressaoSistolica: dados.pressaoSistolica,
      pressaoDiastolica: dados.pressaoDiastolica,
      pulso: dados.pulso,
      temperatura: dados.temperatura,
      peso: dados.peso,
      observacoes: dados.observacoes,
      elegivel: dados.elegivel !== undefined ? dados.elegivel : true,
      motivoInelegibilidade: dados.motivoInelegibilidade,
      tecnico,
    });

    const registroSalvo = await repositorioRegistro().save(registro);

    // Actualizar status do agendamento e notificar o doador
    if (agendamento) {
      const statusNovo = registroSalvo.elegivel ? StatusDoacao.EM_PROCESSAMENTO : StatusDoacao.RECUSADO;
      await repositorioAgendamento().update(agendamento.id, { status: statusNovo });

      if (registroSalvo.elegivel) {
        notificacaoServico.criar({
          idDestinatario: doador.id,
          titulo: 'Triagem Clínica Aprovada',
          mensagem: 'A sua triagem clínica foi concluída com sucesso. O sangue está em processamento laboratorial.',
          tipo: TipoNotificacao.TRIAGEM_EM_PROCESSAMENTO,
          tipoEntidadeRelacionada: 'agendamento',
          idEntidadeRelacionada: agendamento.id,
        }).catch(() => {});
      } else {
        notificacaoServico.criar({
          idDestinatario: doador.id,
          titulo: 'Triagem Clínica Recusada',
          mensagem: `Infelizmente não foi possível realizar a doação: ${registroSalvo.motivoInelegibilidade ?? 'critérios de elegibilidade não cumpridos'}.`,
          tipo: TipoNotificacao.DOACAO_RECUSADA,
          tipoEntidadeRelacionada: 'agendamento',
          idEntidadeRelacionada: agendamento.id,
        }).catch(() => {});
      }
    }

    return registroSalvo;
  }

  async atualizar(id: number, dados: Partial<{
    quantidade: number;
    tipoSangue: string;
    tipoComponente: string;
    nivelHemoglobina: number;
    pressaoSistolica: number;
    pressaoDiastolica: number;
    pulso: number;
    temperatura: number;
    peso: number;
    observacoes: string;
    elegivel: boolean;
    motivoInelegibilidade: string;
  }>): Promise<RegistroDoacao> {
    const registro = await repositorioRegistro().findOne({ where: { id }, relations: ['doador', 'hemocentro', 'agendamento', 'tecnico'] });
    if (!registro) throw new Error('Registro de doação não encontrado');

    if (dados.quantidade != null) registro.quantidade = dados.quantidade;
    if (dados.tipoSangue != null) registro.tipoSangue = dados.tipoSangue;
    if (dados.tipoComponente != null) registro.tipoComponente = dados.tipoComponente;
    if (dados.nivelHemoglobina != null) registro.nivelHemoglobina = dados.nivelHemoglobina;
    if (dados.pressaoSistolica != null) registro.pressaoSistolica = dados.pressaoSistolica;
    if (dados.pressaoDiastolica != null) registro.pressaoDiastolica = dados.pressaoDiastolica;
    if (dados.pulso != null) registro.pulso = dados.pulso;
    if (dados.temperatura != null) registro.temperatura = dados.temperatura;
    if (dados.peso != null) registro.peso = dados.peso;
    if (dados.observacoes != null) registro.observacoes = dados.observacoes;
    if (dados.elegivel != null) registro.elegivel = dados.elegivel;
    if (dados.motivoInelegibilidade != null) registro.motivoInelegibilidade = dados.motivoInelegibilidade;

    return repositorioRegistro().save(registro);
  }

  async remover(id: number): Promise<void> {
    const registro = await repositorioRegistro().findOne({ where: { id } });
    if (!registro) throw new Error('Registro de doação não encontrado');
    await repositorioRegistro().remove(registro);
  }

  async buscarPorId(id: number): Promise<RegistroDoacao> {
    const registro = await repositorioRegistro().findOne({ where: { id }, relations: ['doador', 'hemocentro', 'agendamento', 'tecnico'] });
    if (!registro) throw new Error('Registro de doação não encontrado');
    return registro;
  }

  async buscarTodos(): Promise<RegistroDoacao[]> {
    return repositorioRegistro().find({ relations: ['doador', 'hemocentro'], order: { dataDoacao: 'DESC' } });
  }

  async buscarPorDoador(idDoador: number): Promise<RegistroDoacao[]> {
    return repositorioRegistro().find({
      where: { doador: { id: idDoador } },
      relations: ['doador', 'hemocentro'],
      order: { dataDoacao: 'DESC' },
    });
  }

  async buscarPorHemocentro(idHemocentro: number): Promise<RegistroDoacao[]> {
    return repositorioRegistro().find({
      where: { hemocentro: { id: idHemocentro } },
      relations: ['doador', 'hemocentro'],
      order: { dataDoacao: 'DESC' },
    });
  }

  async buscarPorAgendamento(idAgendamento: number): Promise<RegistroDoacao | null> {
    return repositorioRegistro().findOne({
      where: { agendamento: { id: idAgendamento } },
      relations: ['doador', 'hemocentro', 'agendamento', 'tecnico'],
    });
  }
}

export const registroDoacaoServico = new RegistroDoacaoServico();
