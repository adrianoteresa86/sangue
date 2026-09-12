import { FonteDados } from '../configuracao/banco';
import { TesteSangue } from '../entidades/TesteSangue';
import { RegistroDoacao } from '../entidades/RegistroDoacao';
import { AgendamentoDoacao } from '../entidades/AgendamentoDoacao';
import { EstoqueSangue } from '../entidades/EstoqueSangue';
import { Hemocentro } from '../entidades/Hemocentro';
import { Usuario } from '../entidades/Usuario';
import { StatusTeste } from '../utilitarios/status-teste.enum';
import { StatusDoacao } from '../utilitarios/status-doacao.enum';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';
import { notificacaoServico } from './notificacao.servico';

const repo           = () => FonteDados.getRepository(TesteSangue);
const repoRegistro   = () => FonteDados.getRepository(RegistroDoacao);
const repoAgendamento= () => FonteDados.getRepository(AgendamentoDoacao);
const repoEstoque    = () => FonteDados.getRepository(EstoqueSangue);
const repoHemocentro = () => FonteDados.getRepository(Hemocentro);

/** Calcula a data de validade do sangue com base no componente (normas clínicas). */
function dataValidade(tipoComponente: string): Date {
  const agora = new Date();
  const c = tipoComponente.toLowerCase();
  let dias = 42; // concentrado de hemácias / sangue total — padrão
  if (c.includes('plaquet') || c.includes('plaq')) dias = 5;
  else if (c.includes('plasma'))                   dias = 365;
  return new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
}

export class TesteSangueServico {

  async criar(dados: {
    idRegistroDoacao: number;
    status?: StatusTeste;
    hiv?: boolean;
    hepatiteB?: boolean;
    hepatiteC?: boolean;
    sifilis?: boolean;
    chagas?: boolean;
    htlv?: boolean;
    tipoSanguineo?: string;
    fatorRh?: boolean;
    observacoes?: string;
    idTecnico?: number;
  }): Promise<TesteSangue> {

    // 1. Validações iniciais
    const registro = await repoRegistro().findOne({ where: { id: dados.idRegistroDoacao } });
    if (!registro) throw new Error('Registro de doação não encontrado');

    const existente = await repo().findOne({ where: { registroDoacao: { id: dados.idRegistroDoacao } } });
    if (existente) throw new Error('Já existe um teste de sangue para este registro de doação');

    let tecnico: Usuario | null = null;
    if (dados.idTecnico) {
      tecnico = await FonteDados.getRepository(Usuario).findOne({ where: { id: dados.idTecnico } });
    }

    // 2. Criar e guardar o teste
    const teste = repo().create({
      registroDoacao: registro,
      tecnico: tecnico ?? undefined,
      status: dados.status ?? StatusTeste.PENDENTE,
      hiv: dados.hiv,
      hepatiteB: dados.hepatiteB,
      hepatiteC: dados.hepatiteC,
      sifilis: dados.sifilis,
      chagas: dados.chagas,
      htlv: dados.htlv,
      tipoSanguineo: dados.tipoSanguineo,
      fatorRh: dados.fatorRh,
      observacoes: dados.observacoes,
    });
    const testeSalvo = await repo().save(teste);

    // 3. Pós-processamento apenas quando os testes ficam concluídos
    if (testeSalvo.status !== StatusTeste.CONCLUIDO) return testeSalvo;

    // Recarregar com todas as relações necessárias
    const reg = await repoRegistro().findOne({
      where: { id: dados.idRegistroDoacao },
      relations: ['agendamento', 'agendamento.usuario', 'doador', 'hemocentro'],
    });

    if (!reg) return testeSalvo;

    const algumPositivo = [
      dados.hiv, dados.hepatiteB, dados.hepatiteC,
      dados.sifilis, dados.chagas, dados.htlv,
    ].some((v) => v === true);

    const statusFinal = algumPositivo ? StatusDoacao.RECUSADO : StatusDoacao.CONCLUIDA;

    // 4. Actualizar status do agendamento (se existir)
    if (reg.agendamento) {
      await repoAgendamento().update(reg.agendamento.id, { status: statusFinal });
    }

    // 5. Sangue aprovado → adicionar ao estoque
    if (!algumPositivo) {
      if (!reg.hemocentro) {
        console.error('[Estoque] RegistroDoacao sem hemocentro — impossível criar entrada no estoque. id=', reg.id);
      } else {
        const hemocentro = await repoHemocentro().findOneBy({ id: reg.hemocentro.id });
        if (!hemocentro) {
          console.error('[Estoque] Hemocentro não encontrado. id=', reg.hemocentro.id);
        } else {
          const novaEntrada = repoEstoque().create({
            hemocentro,
            tipoSangue:     dados.tipoSanguineo ?? reg.tipoSangue,
            tipoComponente: reg.tipoComponente,
            quantidade:     reg.quantidade,
            dataValidade:   dataValidade(reg.tipoComponente),
            dataRecebimento: new Date(),
            disponivel:     true,
          });
          await repoEstoque().save(novaEntrada);
          console.log(`[Estoque] +${reg.quantidade}mL de ${dados.tipoSanguineo ?? reg.tipoSangue} adicionado. Estoque id=${novaEntrada.id}`);
        }
      }
    }

    // 6. Notificar o doador
    const idDoador = reg.agendamento?.usuario?.id ?? reg.doador?.id;
    if (idDoador) {
      const notif = algumPositivo
        ? {
            titulo:  'Resultado dos Testes Laboratoriais',
            mensagem:'O seu sangue não pôde ser aprovado devido aos resultados dos testes sorológicos. Consulte o hemocentro para mais informações.',
            tipo:    TipoNotificacao.DOACAO_RECUSADA,
          }
        : {
            titulo:  'Doação Concluída com Sucesso!',
            mensagem:'Todos os testes sorológicos foram negativos. A sua doação foi concluída com sucesso. Obrigado por salvar vidas!',
            tipo:    TipoNotificacao.DOACAO_CONFIRMADA,
          };

      notificacaoServico.criar({
        idDestinatario: idDoador,
        ...notif,
        tipoEntidadeRelacionada: 'agendamento',
        idEntidadeRelacionada:   reg.agendamento?.id,
      }).catch(() => {});
    }

    return testeSalvo;
  }

  async atualizar(id: number, dados: Partial<{
    status: StatusTeste;
    hiv: boolean;
    hepatiteB: boolean;
    hepatiteC: boolean;
    sifilis: boolean;
    chagas: boolean;
    htlv: boolean;
    tipoSanguineo: string;
    fatorRh: boolean;
    observacoes: string;
  }>): Promise<TesteSangue> {
    const teste = await repo().findOne({ where: { id }, relations: ['registroDoacao', 'tecnico'] });
    if (!teste) throw new Error('Teste de sangue não encontrado');

    if (dados.status != null) {
      teste.status = dados.status;
      if (dados.status === StatusTeste.CONCLUIDO) teste.dataConclusao = new Date();
    }
    if (dados.hiv           != null) teste.hiv           = dados.hiv;
    if (dados.hepatiteB     != null) teste.hepatiteB     = dados.hepatiteB;
    if (dados.hepatiteC     != null) teste.hepatiteC     = dados.hepatiteC;
    if (dados.sifilis       != null) teste.sifilis       = dados.sifilis;
    if (dados.chagas        != null) teste.chagas        = dados.chagas;
    if (dados.htlv          != null) teste.htlv          = dados.htlv;
    if (dados.tipoSanguineo != null) teste.tipoSanguineo = dados.tipoSanguineo;
    if (dados.fatorRh       != null) teste.fatorRh       = dados.fatorRh;
    if (dados.observacoes   != null) teste.observacoes   = dados.observacoes;

    return repo().save(teste);
  }

  async buscarPorId(id: number): Promise<TesteSangue> {
    const teste = await repo().findOne({
      where: { id },
      relations: ['registroDoacao', 'registroDoacao.doador', 'registroDoacao.hemocentro', 'tecnico'],
    });
    if (!teste) throw new Error('Teste de sangue não encontrado');
    return teste;
  }

  async buscarPorRegistroDoacao(idRegistro: number): Promise<TesteSangue | null> {
    return repo().findOne({
      where: { registroDoacao: { id: idRegistro } },
      relations: ['registroDoacao', 'tecnico'],
    });
  }

  async buscarPorAgendamento(idAgendamento: number): Promise<TesteSangue | null> {
    const registro = await repoRegistro().findOne({ where: { agendamento: { id: idAgendamento } } });
    if (!registro) return null;
    return repo().findOne({
      where: { registroDoacao: { id: registro.id } },
      relations: ['registroDoacao', 'registroDoacao.doador', 'tecnico'],
    });
  }

  async buscarTodos(): Promise<TesteSangue[]> {
    return repo().find({
      relations: ['registroDoacao', 'registroDoacao.doador', 'tecnico'],
      order: { criadoEm: 'DESC' },
    });
  }
}

export const testeSangueServico = new TesteSangueServico();
