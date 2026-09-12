import { FonteDados } from "../configuracao/banco";
import { AgendamentoDoacao } from "../entidades/AgendamentoDoacao";
import { Usuario } from "../entidades/Usuario";
import { Hemocentro } from "../entidades/Hemocentro";
import { PerfilDoador } from "../entidades/PerfilDoador";
import { StatusDoacao } from "../utilitarios/status-doacao.enum";

const repositorioAgendamento = () =>
  FonteDados.getRepository(AgendamentoDoacao);
const repositorioUsuario = () => FonteDados.getRepository(Usuario);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);
const repositorioPerfilDoador = () => FonteDados.getRepository(PerfilDoador);

// Retorna o último agendamento CONCLUÍDO do doador (prova de doação efectuada)
async function ultimaDoacaoConcluida(idUsuario: number): Promise<AgendamentoDoacao | null> {
  return repositorioAgendamento().findOne({
    where: { usuario: { id: idUsuario }, status: StatusDoacao.CONCLUIDA },
    order: { dataPreferida: "DESC" },
  });
}

// Intervalo mínimo: mulheres 3 meses, homens 4 meses
function intervaloMeses(genero?: string): number {
  return genero === "FEMININO" ? 3 : 4;
}

export class AgendamentoDoacaoServico {
  async buscarTodos(): Promise<AgendamentoDoacao[]> {
    return repositorioAgendamento().find({
      relations: ["usuario", "hemocentro"],
      order: { dataPreferida: "DESC" },
    });
  }

  async criar(
    dados: {
      idHemocentro: number;
      dataPreferida: Date;
      horaPreferida?: string;
      tipoSangue?: string;
      observacoes?: string;
      nomeContatoEmergencia?: string;
      telefoneContatoEmergencia?: string;
      cidade?: string;
    },
    idUsuario: number,
  ): Promise<AgendamentoDoacao> {
    try {
      const usuario = await repositorioUsuario().findOne({
        where: { id: idUsuario },
      });
      if (!usuario) throw new Error("Utilizador não encontrado");

      const hemocentro = await repositorioHemocentro().findOne({
        where: { id: dados.idHemocentro },
      });
      if (!hemocentro) throw new Error("Hemocentro não encontrado");

      if (!hemocentro.ativo) throw new Error("Hemocentro não está activo");

      const dataPreferida = new Date(dados.dataPreferida);
      if (isNaN(dataPreferida.getTime()))
        throw new Error("Data preferida inválida");

      const dataPreferidaSomenteData = new Date(dataPreferida);
      dataPreferidaSomenteData.setHours(0, 0, 0, 0);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataPreferidaSomenteData < hoje)
        throw new Error("Data preferida não pode ser no passado");

      const inicioDia = new Date(dataPreferidaSomenteData);
      const fimDia = new Date(dataPreferidaSomenteData);
      fimDia.setHours(23, 59, 59, 999);

    

      const existente = await repositorioAgendamento()
        .createQueryBuilder("a")
        .where("a.user_id = :idUsuario", { idUsuario })
        .andWhere("a.status IN (:...ativos)", {
          ativos: [
            StatusDoacao.PENDENTE,
            StatusDoacao.APROVADO,
            StatusDoacao.EM_PROCESSAMENTO,
            StatusDoacao.REAGENDAMENTO_SOLICITADO,
          ],
        })
        .andWhere("a.dataPreferida BETWEEN :inicio AND :fim", {
          inicio: inicioDia,
          fim: fimDia,
        })
        .getOne();

      if (existente)
        throw new Error("Utilizador já tem doação agendada para este dia");

      // Validações do perfil doador (regras oficiais)
      const perfil = await repositorioPerfilDoador().findOne({
        where: { usuario: { id: idUsuario } },
      });

      if (perfil) {
        // Regra 1: Idade entre 18 e 65 anos
        if (perfil.idade !== null && perfil.idade !== undefined) {
          if (perfil.idade < 18 || perfil.idade > 65) {
            throw new Error(
              `A idade deve estar entre 18 e 65 anos. Idade registada no perfil: ${perfil.idade} anos.`,
            );
          }
        }

        // Regra 2: Peso mínimo 50 kg
        if (perfil.peso !== null && perfil.peso !== undefined) {
          if (perfil.peso < 50) {
            throw new Error(
              `O peso mínimo para doação é 50 kg. Peso registado no perfil: ${perfil.peso} kg.`,
            );
          }
        }

        // Regra 3: Intervalo entre doações — mulheres 3 meses, homens 4 meses
        const ultimaConcluida = await ultimaDoacaoConcluida(idUsuario);

        if (ultimaConcluida) {
          const meses = intervaloMeses(perfil.genero);
          const proximaDataDisp = new Date(ultimaConcluida.dataPreferida);
          proximaDataDisp.setMonth(proximaDataDisp.getMonth() + meses);

          if (new Date() < proximaDataDisp) {
            const generoLabel = perfil.genero === "FEMININO" ? "mulheres" : "homens";
            throw new Error(
              `Intervalo mínimo entre doações para ${generoLabel} é de ${meses} meses. Próxima doação disponível: ${proximaDataDisp.toLocaleDateString("pt-PT")}.`,
            );
          }
        }
      }

      const tipoSangue = dados.tipoSangue?.trim() || perfil?.tipoSangue?.trim() || undefined;

      const agendamento = repositorioAgendamento().create({
        usuario,
        hemocentro,
        dataPreferida,
        horaPreferida: dados.horaPreferida,
        tipoSangue,
        status: StatusDoacao.PENDENTE,
        observacoes: dados.observacoes,
        nomeContatoEmergencia: dados.nomeContatoEmergencia,
        telefoneContatoEmergencia: dados.telefoneContatoEmergencia,
        cidade: dados.cidade,
      });

      return repositorioAgendamento().save(agendamento);
    } catch (erro: any) {
      throw erro;
    }
  }

  async buscarPorUsuario(idUsuario: number): Promise<AgendamentoDoacao[]> {
    return repositorioAgendamento().find({
      where: { usuario: { id: idUsuario } },
      relations: ["usuario", "hemocentro"],
      order: { dataPreferida: "DESC" },
    });
  }

  async buscarFuturosPorUsuario(
    idUsuario: number,
  ): Promise<AgendamentoDoacao[]> {
    return repositorioAgendamento()
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.usuario", "u")
      .leftJoinAndSelect("a.hemocentro", "h")
      .where("a.user_id = :idUsuario", { idUsuario })
      .andWhere("a.dataPreferida >= :agora", { agora: new Date() })
      .orderBy("a.dataPreferida", "ASC")
      .getMany();
  }

  async buscarPassadosPorUsuario(
    idUsuario: number,
  ): Promise<AgendamentoDoacao[]> {
    return repositorioAgendamento()
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.usuario", "u")
      .leftJoinAndSelect("a.hemocentro", "h")
      .where("a.user_id = :idUsuario", { idUsuario })
      .andWhere("a.dataPreferida < :agora", { agora: new Date() })
      .orderBy("a.dataPreferida", "DESC")
      .getMany();
  }

  async actualizarStatus(
    idAgendamento: number,
    status: StatusDoacao,
  ): Promise<AgendamentoDoacao> {
    const agendamento = await repositorioAgendamento().findOne({
      where: { id: idAgendamento },
      relations: ["usuario", "hemocentro"],
    });
    if (!agendamento) throw new Error("Agendamento não encontrado");

    if (
      agendamento.status === StatusDoacao.CONCLUIDA &&
      status !== StatusDoacao.CONCLUIDA
    ) {
      throw new Error(
        "Não é possível alterar o status de uma doação concluída",
      );
    }

    if (
      agendamento.status === StatusDoacao.CANCELADA &&
      status === StatusDoacao.PENDENTE
    ) {
      throw new Error("Não é possível reactivar um agendamento cancelado");
    }

    agendamento.status = status;
    return repositorioAgendamento().save(agendamento);
  }

  async cancelar(idAgendamento: number, idUsuario: number): Promise<void> {
    const agendamento = await repositorioAgendamento().findOne({
      where: { id: idAgendamento },
      relations: ["usuario"],
    });
    if (!agendamento) throw new Error("Agendamento não encontrado");

    if (agendamento.usuario.id !== idUsuario)
      throw new Error("Agendamento não pertence a este utilizador");

    if (agendamento.status === StatusDoacao.CONCLUIDA)
      throw new Error("Não é possível cancelar uma doação concluída");
    if (agendamento.status === StatusDoacao.CANCELADA)
      throw new Error("Agendamento já está cancelado");

    const agora = new Date();
    const limiteMinimoCancelamento = new Date(agendamento.dataPreferida);
    limiteMinimoCancelamento.setHours(limiteMinimoCancelamento.getHours() - 24);

    if (agora > limiteMinimoCancelamento)
      throw new Error(
        "Não é possível cancelar com menos de 24 horas de antecedência",
      );

    agendamento.status = StatusDoacao.CANCELADA;
    await repositorioAgendamento().save(agendamento);
  }

  async reagendar(
    idAgendamento: number,
    idUsuario: number,
    dados: { dataPreferida: Date; horaPreferida?: string },
  ): Promise<AgendamentoDoacao> {
    const agendamento = await repositorioAgendamento().findOne({
      where: { id: idAgendamento },
      relations: ['usuario'],
    });
    if (!agendamento) throw new Error('Agendamento não encontrado');
    if (agendamento.usuario.id !== idUsuario)
      throw new Error('Agendamento não pertence a este utilizador');
    if (agendamento.status !== StatusDoacao.PENDENTE)
      throw new Error('Só é possível solicitar reagendamento de agendamentos pendentes de aprovação');

    const novaData = new Date(dados.dataPreferida);
    if (isNaN(novaData.getTime())) throw new Error('Data inválida');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (novaData < hoje) throw new Error('A nova data não pode ser no passado');

    const inicioDia = new Date(novaData);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(novaData);
    fimDia.setHours(23, 59, 59, 999);

    // Só bloqueia se houver outro agendamento ACTIVO (exclui terminais e o próprio)
    const conflito = await repositorioAgendamento()
      .createQueryBuilder('a')
      .where('a.user_id = :idUsuario', { idUsuario })
      .andWhere('a.id != :id', { id: idAgendamento })
      .andWhere('a.status IN (:...ativos)', {
        ativos: [
          StatusDoacao.PENDENTE,
          StatusDoacao.APROVADO,
          StatusDoacao.EM_PROCESSAMENTO,
          StatusDoacao.REAGENDAMENTO_SOLICITADO,
        ],
      })
      .andWhere('a.dataPreferida BETWEEN :inicio AND :fim', { inicio: inicioDia, fim: fimDia })
      .getOne();

    if (conflito) throw new Error('Já tem um agendamento activo para este dia');

    // Guarda a solicitação de reagendamento para aprovação do admin
    agendamento.novaDataSolicitada = novaData;
    agendamento.novaHoraSolicitada = dados.horaPreferida ?? agendamento.horaPreferida ?? null;
    agendamento.status = StatusDoacao.REAGENDAMENTO_SOLICITADO;
    return repositorioAgendamento().save(agendamento);
  }

  async aprovarReagendamento(idAgendamento: number): Promise<AgendamentoDoacao> {
    const agendamento = await repositorioAgendamento().findOne({
      where: { id: idAgendamento },
      relations: ['usuario', 'hemocentro'],
    });
    if (!agendamento) throw new Error('Agendamento não encontrado');
    if (agendamento.status !== StatusDoacao.REAGENDAMENTO_SOLICITADO)
      throw new Error('Este agendamento não tem um pedido de reagendamento pendente');

    agendamento.dataPreferida = agendamento.novaDataSolicitada;
    agendamento.horaPreferida = agendamento.novaHoraSolicitada ?? agendamento.horaPreferida;
    agendamento.novaDataSolicitada = null;
    agendamento.novaHoraSolicitada = null;
    agendamento.status = StatusDoacao.PENDENTE;
    return repositorioAgendamento().save(agendamento);
  }

  async rejeitarReagendamento(idAgendamento: number): Promise<AgendamentoDoacao> {
    const agendamento = await repositorioAgendamento().findOne({
      where: { id: idAgendamento },
      relations: ['usuario', 'hemocentro'],
    });
    if (!agendamento) throw new Error('Agendamento não encontrado');
    if (agendamento.status !== StatusDoacao.REAGENDAMENTO_SOLICITADO)
      throw new Error('Este agendamento não tem um pedido de reagendamento pendente');

    agendamento.novaDataSolicitada = null;
    agendamento.novaHoraSolicitada = null;
    agendamento.status = StatusDoacao.PENDENTE;
    return repositorioAgendamento().save(agendamento);
  }

  async buscarPorId(id: number): Promise<AgendamentoDoacao> {
    const agendamento = await repositorioAgendamento().findOne({
      where: { id },
      relations: ["usuario", "hemocentro"],
    });
    if (!agendamento) throw new Error("Agendamento não encontrado");
    return agendamento;
  }

  async buscarPorHemocentro(
    idHemocentro: number,
  ): Promise<AgendamentoDoacao[]> {
    return repositorioAgendamento().find({
      where: { hemocentro: { id: idHemocentro } },
      relations: ["usuario", "hemocentro"],
      order: { dataPreferida: "ASC" },
    });
  }

  async podeDoar(idUsuario: number): Promise<boolean> {
    const ultima = await ultimaDoacaoConcluida(idUsuario);
    if (!ultima) return true;

    const perfil = await repositorioPerfilDoador().findOne({
      where: { usuario: { id: idUsuario } },
    });
    const meses = intervaloMeses(perfil?.genero);
    const limiteAtras = new Date();
    limiteAtras.setMonth(limiteAtras.getMonth() - meses);

    return ultima.dataPreferida < limiteAtras;
  }

  async proximaDataDisponivel(idUsuario: number): Promise<string> {
    const ultima = await ultimaDoacaoConcluida(idUsuario);
    if (!ultima) return "hoje";

    const perfil = await repositorioPerfilDoador().findOne({
      where: { usuario: { id: idUsuario } },
    });
    const meses = intervaloMeses(perfil?.genero);
    const limiteAtras = new Date();
    limiteAtras.setMonth(limiteAtras.getMonth() - meses);

    if (ultima.dataPreferida < limiteAtras) return "hoje";

    const proxima = new Date(ultima.dataPreferida);
    proxima.setMonth(proxima.getMonth() + meses);
    return proxima.toISOString().split("T")[0];
  }
}

export const agendamentoDoacaoServico = new AgendamentoDoacaoServico();
