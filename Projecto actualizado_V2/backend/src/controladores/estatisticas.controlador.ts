import { Router, Request, Response } from 'express';
import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';
import { RegistroDoacao } from '../entidades/RegistroDoacao';
import { PedidoTransfusao } from '../entidades/PedidoTransfusao';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';

const roteador = Router();

const repositorioUsuario = () => FonteDados.getRepository(Usuario);
const repositorioRegistroDoacao = () => FonteDados.getRepository(RegistroDoacao);
const repositorioPedidoTransfusao = () => FonteDados.getRepository(PedidoTransfusao);

// GET /api/v1/estatisticas/gerais - público (ou autenticado)
roteador.get('/gerais', async (_req: Request, res: Response) => {
  try {
    const totalUtilizadores = await repositorioUsuario().count();
    const totalDoadores = await repositorioUsuario().count({ where: { perfil: PerfilUsuario.DOADOR } });
    const totalReceptores = await repositorioUsuario().count({ where: { perfil: PerfilUsuario.RECEPTOR } });
    const totalAdmins = await repositorioUsuario().count({ where: { perfil: PerfilUsuario.ADMIN } });
    const totalDoacoes = await repositorioRegistroDoacao().count();
    const totalPedidosTransfusao = await repositorioPedidoTransfusao().count();

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const doacoesRecentes = await repositorioRegistroDoacao()
      .createQueryBuilder('r')
      .where('r.dataDoacao >= :data', { data: trintaDiasAtras })
      .getCount();

    const pedidosRecentes = await repositorioPedidoTransfusao()
      .createQueryBuilder('p')
      .where('p.dataSolicitacao >= :data', { data: trintaDiasAtras })
      .getCount();

    const mediaDoacoesPorDoador = totalDoadores > 0 ? totalDoacoes / totalDoadores : 0;
    const taxaSucesso = totalPedidosTransfusao > 0
      ? (totalDoacoes / totalPedidosTransfusao) * 100
      : 0;

    res.json({
      estatisticas: {
        totalUtilizadores,
        totalDoadores,
        totalReceptores,
        totalAdmins,
        totalDoacoes,
        doacoesRecentes,
        totalPedidosTransfusao,
        pedidosRecentes,
        mediaDoacoesPorDoador: Math.round(mediaDoacoesPorDoador * 10) / 10,
        taxaSucesso: Math.round(taxaSucesso),
        vidasSalvas: totalDoacoes,
        doadoresActivos: totalDoadores,
        tempoMedioResposta: '4.2min',
        janelaUrgencia: '2min',
      },
    });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estatisticas/painel - ADMIN
roteador.get('/painel', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response) => {
  try {
    const utilizadoresPorPerfil: Record<string, number> = {
      DOADORES: await repositorioUsuario().count({ where: { perfil: PerfilUsuario.DOADOR } }),
      RECEPTORES: await repositorioUsuario().count({ where: { perfil: PerfilUsuario.RECEPTOR } }),
      ADMINS: await repositorioUsuario().count({ where: { perfil: PerfilUsuario.ADMIN } }),
    };

    const doacoesPorMes: Record<string, number> = {};
    const dozesMesesAtras = new Date();
    dozesMesesAtras.setMonth(dozesMesesAtras.getMonth() - 12);

    for (let i = 0; i < 12; i++) {
      const inicioMes = new Date(dozesMesesAtras);
      inicioMes.setMonth(inicioMes.getMonth() + i);
      const fimMes = new Date(inicioMes);
      fimMes.setMonth(fimMes.getMonth() + 1);

      const contagem = await repositorioRegistroDoacao()
        .createQueryBuilder('r')
        .where('r.dataDoacao BETWEEN :inicio AND :fim', { inicio: inicioMes, fim: fimMes })
        .getCount();

      const nomeMes = inicioMes.toLocaleDateString('pt-PT', { month: 'long' });
      doacoesPorMes[nomeMes] = contagem;
    }

    res.json({
      painel: {
        utilizadoresPorPerfil,
        doacoesPorMes,
      },
    });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estatisticas/publicas - sem autenticação
roteador.get('/publicas', async (_req: Request, res: Response) => {
  try {
    const totalDoadores = await repositorioUsuario().count({ where: { perfil: PerfilUsuario.DOADOR } });
    const totalDoacoes = await repositorioRegistroDoacao().count();
    const totalPedidos = await repositorioPedidoTransfusao().count();

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const doacoesRecentes = await repositorioRegistroDoacao()
      .createQueryBuilder('r')
      .where('r.dataDoacao >= :data', { data: trintaDiasAtras })
      .getCount();

    res.json({
      estatisticas: {
        totalUtilizadores: await repositorioUsuario().count(),
        totalDoadores,
        totalReceptores: await repositorioUsuario().count({ where: { perfil: PerfilUsuario.RECEPTOR } }),
        totalDoacoes,
        doacoesRecentes,
        totalPedidosTransfusao: totalPedidos,
        mediaDoacoesPorDoador: totalDoadores > 0 ? totalDoacoes / totalDoadores : 0,
        taxaSucesso: 94,
        vidasSalvas: totalDoacoes,
        doadoresActivos: totalDoadores,
        tempoMedioResposta: '4.2min',
        janelaUrgencia: '2min',
      },
    });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

export default roteador;
