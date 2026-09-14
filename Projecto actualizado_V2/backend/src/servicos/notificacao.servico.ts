import { FonteDados } from '../configuracao/banco';
import { Notificacao } from '../entidades/Notificacao';
import { Usuario } from '../entidades/Usuario';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';

const repositorioNotificacao = () => FonteDados.getRepository(Notificacao);
const repositorioUsuario = () => FonteDados.getRepository(Usuario);

export class NotificacaoServico {
  async criar(dados: {
    idDestinatario: number;
    titulo: string;
    mensagem: string;
    tipo: TipoNotificacao;
    expiraEm?: Date;
    tipoEntidadeRelacionada?: string;
    idEntidadeRelacionada?: number;
    idRemetente?: number;
    notificacaoPaiId?: number;
  }): Promise<Notificacao> {
    const destinatario = await repositorioUsuario().findOne({ where: { id: dados.idDestinatario } });
    if (!destinatario) throw new Error('Utilizador destinatário não encontrado');

    const notificacao = repositorioNotificacao().create({
      destinatario,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      tipo: dados.tipo,
      expiraEm: dados.expiraEm,
      tipoEntidadeRelacionada: dados.tipoEntidadeRelacionada,
      idEntidadeRelacionada: dados.idEntidadeRelacionada,
      remetente: dados.idRemetente ? ({ id: dados.idRemetente } as Usuario) : undefined,
      notificacaoPaiId: dados.notificacaoPaiId,
    });

    return repositorioNotificacao().save(notificacao);
  }

  async criarEmMassa(dados: {
    idsDestinatarios: number[];
    titulo: string;
    mensagem: string;
    tipo: TipoNotificacao;
  }): Promise<Notificacao[]> {
    const resultados: Notificacao[] = [];
    for (const idDestinatario of dados.idsDestinatarios) {
      try {
        const n = await this.criar({ idDestinatario, titulo: dados.titulo, mensagem: dados.mensagem, tipo: dados.tipo });
        resultados.push(n);
      } catch {
        // Ignorar utilizadores não encontrados
      }
    }
    return resultados;
  }

  async criarEmMassaLista(dados: {
    titulo: string;
    mensagem: string;
    tipo: TipoNotificacao;
    perfis?: string[];
  }): Promise<Notificacao[]> {
    let utilizadores: Usuario[];
    if (dados.perfis && dados.perfis.length > 0) {
      utilizadores = await repositorioUsuario()
        .createQueryBuilder('u')
        .where('u.perfil IN (:...perfis)', { perfis: dados.perfis })
        .getMany();
    } else {
      utilizadores = await repositorioUsuario().find();
    }

    return this.criarEmMassa({
      idsDestinatarios: utilizadores.map(u => u.id),
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      tipo: dados.tipo,
    });
  }

  async buscarTodas(): Promise<Notificacao[]> {
    return repositorioNotificacao().find({ relations: ['destinatario', 'remetente'], order: { criadoEm: 'DESC' } });
  }

  async buscarPorId(id: number): Promise<Notificacao> {
    const notificacao = await repositorioNotificacao().findOne({
      where: { id },
      relations: ['destinatario', 'remetente'],
    });
    if (!notificacao) throw new Error('Notificação não encontrada');
    return notificacao;
  }

  async atualizar(id: number, dados: Partial<{
    titulo: string;
    mensagem: string;
    tipo: TipoNotificacao;
    expiraEm: Date;
    tipoEntidadeRelacionada: string;
    idEntidadeRelacionada: number;
  }>): Promise<Notificacao> {
    const notificacao = await this.buscarPorId(id);
    Object.assign(notificacao, dados);
    return repositorioNotificacao().save(notificacao);
  }

  async buscarPorUsuario(idUsuario: number): Promise<Notificacao[]> {
    return repositorioNotificacao().find({
      where: { destinatario: { id: idUsuario } },
      relations: ['remetente'],
      order: { criadoEm: 'DESC' },
    });
  }

  async buscarNaoLidasPorUsuario(idUsuario: number): Promise<Notificacao[]> {
    return repositorioNotificacao().find({
      where: { destinatario: { id: idUsuario }, lida: false },
      relations: ['remetente'],
      order: { criadoEm: 'DESC' },
    });
  }

  async buscarPorTipo(tipo: TipoNotificacao): Promise<Notificacao[]> {
    return repositorioNotificacao().find({
      where: { tipo },
      relations: ['destinatario'],
      order: { criadoEm: 'DESC' },
    });
  }

  async buscarPorEntidadeRelacionada(tipoEntidade: string, idEntidade: number): Promise<Notificacao[]> {
    return repositorioNotificacao().find({
      where: { tipoEntidadeRelacionada: tipoEntidade, idEntidadeRelacionada: idEntidade },
      relations: ['destinatario'],
      order: { criadoEm: 'DESC' },
    });
  }

  async buscarExpiradas(): Promise<Notificacao[]> {
    return repositorioNotificacao()
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.destinatario', 'u')
      .where('n.expiraEm IS NOT NULL AND n.expiraEm < :agora', { agora: new Date() })
      .orderBy('n.criadoEm', 'DESC')
      .getMany();
  }

  async removerExpiradas(): Promise<number> {
    const expiradas = await this.buscarExpiradas();
    if (expiradas.length === 0) return 0;
    await repositorioNotificacao().remove(expiradas);
    return expiradas.length;
  }

  async marcarComoLida(idNotificacao: number, idUsuario: number): Promise<Notificacao> {
    const notificacao = await repositorioNotificacao().findOne({
      where: { id: idNotificacao },
      relations: ['destinatario'],
    });
    if (!notificacao) throw new Error('Notificação não encontrada');
    if (notificacao.destinatario.id !== idUsuario) throw new Error('Notificação não pertence ao utilizador');

    notificacao.lida = true;
    notificacao.lidaEm = new Date();
    return repositorioNotificacao().save(notificacao);
  }

  async marcarTodasComoLidas(idUsuario: number): Promise<void> {
    await repositorioNotificacao()
      .createQueryBuilder()
      .update(Notificacao)
      .set({ lida: true, lidaEm: new Date() })
      .where('user_id = :idUsuario AND is_read = false', { idUsuario })
      .execute();
  }

  async contarNaoLidas(idUsuario: number): Promise<number> {
    return repositorioNotificacao().count({ where: { destinatario: { id: idUsuario }, lida: false } });
  }

  async remover(idNotificacao: number): Promise<void> {
    const notificacao = await repositorioNotificacao().findOne({ where: { id: idNotificacao } });
    if (!notificacao) throw new Error('Notificação não encontrada');
    await repositorioNotificacao().remove(notificacao);
  }

  async criarLembreteDoacao(dados: {
    idDoador: number;
    dataDoacao: Date;
    nomeHemocentro: string;
  }): Promise<Notificacao> {
    const dataFormatada = dados.dataDoacao.toLocaleDateString('pt-PT');
    return this.criar({
      idDestinatario: dados.idDoador,
      titulo: 'Lembrete de Doação',
      mensagem: `Tem uma doação agendada para ${dataFormatada} em ${dados.nomeHemocentro}. Não se esqueça!`,
      tipo: TipoNotificacao.LEMBRETE_DOACAO,
      tipoEntidadeRelacionada: 'agendamento',
    });
  }

  async criarDoacaoConfirmada(dados: {
    idDoador: number;
    dataDoacao: Date;
    nomeHemocentro: string;
  }): Promise<Notificacao> {
    const dataFormatada = dados.dataDoacao.toLocaleDateString('pt-PT');
    return this.criar({
      idDestinatario: dados.idDoador,
      titulo: 'Doação Confirmada',
      mensagem: `A sua doação de ${dataFormatada} em ${dados.nomeHemocentro} foi confirmada. Obrigado por salvar vidas!`,
      tipo: TipoNotificacao.DOACAO_CONFIRMADA,
      tipoEntidadeRelacionada: 'doacao',
    });
  }

  async criarUrgenciaSangue(dados: {
    idsDestinatarios: number[];
    tipoSangue: string;
    nomeHemocentro: string;
  }): Promise<Notificacao[]> {
    return this.criarEmMassa({
      idsDestinatarios: dados.idsDestinatarios,
      titulo: `Urgência: Tipo Sanguíneo ${dados.tipoSangue}`,
      mensagem: `O hemocentro ${dados.nomeHemocentro} precisa urgentemente de sangue do tipo ${dados.tipoSangue}. Por favor, considere fazer uma doação.`,
      tipo: TipoNotificacao.URGENCIA_SANGUE,
    });
  }

  async criarResultadosTeste(dados: {
    idDoador: number;
    idTeste: number;
    resultado: string;
  }): Promise<Notificacao> {
    return this.criar({
      idDestinatario: dados.idDoador,
      titulo: 'Resultados do Teste Disponíveis',
      mensagem: `Os resultados do seu teste de sangue estão disponíveis. Resultado: ${dados.resultado}.`,
      tipo: TipoNotificacao.RESULTADOS_TESTE,
      tipoEntidadeRelacionada: 'teste',
      idEntidadeRelacionada: dados.idTeste,
    });
  }

  async criarNotificacaoPedidoSangue(dados: {
    idsDoadores: number[];
    tipoSangue: string;
    idPedido: number;
  }): Promise<Notificacao[]> {
    return this.criarEmMassa({
      idsDestinatarios: dados.idsDoadores,
      titulo: 'Pedido de Transfusão Urgente',
      mensagem: `Existe um pedido urgente de sangue do tipo ${dados.tipoSangue}. A sua ajuda pode salvar uma vida.`,
      tipo: TipoNotificacao.PEDIDO_TRANSFUSAO,
    });
  }

  async criarNotificacaoAgendamentoDoacao(dados: {
    idDoador: number;
    idAgendamento: number;
    dataAgendamento: Date;
    nomeHemocentro: string;
  }): Promise<Notificacao> {
    const dataFormatada = dados.dataAgendamento.toLocaleDateString('pt-PT');
    return this.criar({
      idDestinatario: dados.idDoador,
      titulo: 'Agendamento Confirmado',
      mensagem: `O seu agendamento de doação para ${dataFormatada} em ${dados.nomeHemocentro} foi confirmado.`,
      tipo: TipoNotificacao.CONSULTA_AGENDADA,
      tipoEntidadeRelacionada: 'agendamento',
      idEntidadeRelacionada: dados.idAgendamento,
    });
  }

  async criarRespostaNotificacao(idNotificacaoOriginal: number, dados: {
    idRemetente: number;
    resposta: string;
  }): Promise<Notificacao> {
    const original = await this.buscarPorId(idNotificacaoOriginal);
    return this.criar({
      idDestinatario: original.remetente ? original.remetente.id : original.destinatario.id, // send back to sender if it exists
      titulo: `Re: ${original.titulo}`,
      mensagem: dados.resposta,
      tipo: TipoNotificacao.MENSAGEM,
      idRemetente: dados.idRemetente,
      notificacaoPaiId: original.id,
    });
  }

  async enviarMensagemSegmentada(dados: {
    tipoDestino: 'TODOS' | 'HEMOCENTRO' | 'USUARIO';
    idRemetente: number;
    titulo: string;
    mensagem: string;
    destinatarioId?: number;
  }): Promise<Notificacao[]> {
    let utilizadores: Usuario[] = [];

    if (dados.tipoDestino === 'TODOS') {
      utilizadores = await repositorioUsuario().find();
    } else if (dados.tipoDestino === 'HEMOCENTRO' && dados.destinatarioId) {
      utilizadores = await repositorioUsuario().find({
        where: { perfilHemocentro: { hemocentro: { id: dados.destinatarioId } } }
      });
    } else if (dados.tipoDestino === 'USUARIO' && dados.destinatarioId) {
      const u = await repositorioUsuario().findOne({ where: { id: dados.destinatarioId } });
      if (u) utilizadores.push(u);
    }

    const resultados: Notificacao[] = [];
    for (const u of utilizadores) {
      try {
        const n = await this.criar({
          idDestinatario: u.id,
          titulo: dados.titulo,
          mensagem: dados.mensagem,
          tipo: TipoNotificacao.MENSAGEM,
          idRemetente: dados.idRemetente,
        });
        resultados.push(n);
      } catch (e) {
        // Ignorar
      }
    }
    return resultados;
  }
}

export const notificacaoServico = new NotificacaoServico();
