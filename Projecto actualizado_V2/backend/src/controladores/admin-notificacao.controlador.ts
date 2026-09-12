import { Router, Request, Response } from 'express';
import { notificacaoServico } from '../servicos/notificacao.servico';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';
import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';

const roteador = Router();

const repositorioUsuario = () => FonteDados.getRepository(Usuario);

// GET /api/v1/admin/notificacoes - ADMIN: listar todas
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar todas as notificações via painel admin'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarTodas());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// POST /api/v1/admin/notificacoes - criar notificação
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Criar notificação individual (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idDestinatario', 'titulo', 'mensagem', 'tipo'],
             properties: {
               idDestinatario: { type: 'integer', example: 1 },
               titulo: { type: 'string', example: 'Aviso importante' },
               mensagem: { type: 'string', example: 'Precisa de actualizar os seus dados.' },
               tipo: { type: 'string', enum: ['DONATION_REMINDER', 'DONATION_CONFIRMED', 'BLOOD_URGENCY', 'CAMPAIGN_ANNOUNCEMENT', 'ADMIN_NOTIFICATION'], example: 'ADMIN_NOTIFICATION' },
               expiraEm: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59Z' },
               tipoEntidadeRelacionada: { type: 'string', example: 'agendamento' },
               idEntidadeRelacionada: { type: 'integer', example: 5 }
             }
           }
         }
       }
     }
  */
  try {
    const notificacao = await notificacaoServico.criar(req.body);
    res.status(201).json(notificacao);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/admin/notificacoes/em-massa - notificações em massa
roteador.post('/em-massa', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Enviar notificações em massa (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idsDestinatarios', 'titulo', 'mensagem', 'tipo'],
             properties: {
               idsDestinatarios: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
               titulo: { type: 'string', example: 'Campanha de Doação' },
               mensagem: { type: 'string', example: 'Venha doar sangue este mês!' },
               tipo: { type: 'string', enum: ['DONATION_REMINDER', 'BLOOD_URGENCY', 'CAMPAIGN_ANNOUNCEMENT', 'ADMIN_NOTIFICATION'], example: 'CAMPAIGN_ANNOUNCEMENT' }
             }
           }
         }
       }
     }
  */
  try {
    const resultados = await notificacaoServico.criarEmMassa(req.body);
    res.status(201).json({ enviadas: resultados.length, notificacoes: resultados });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/admin/notificacoes/novo-utilizador - notificar admins sobre novo utilizador
roteador.post('/novo-utilizador', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Notificar admins sobre novo utilizador registado'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idNovoUtilizador'],
             properties: {
               idNovoUtilizador: { type: 'integer', example: 10 },
               nomeUtilizador: { type: 'string', example: 'João Silva' }
             }
           }
         }
       }
     }
  */
  try {
    const { idNovoUtilizador, nomeUtilizador } = req.body;
    const admins = await repositorioUsuario().find({ where: { perfil: PerfilUsuario.ADMIN } });

    const notificacoes = await notificacaoServico.criarEmMassa({
      idsDestinatarios: admins.map(a => a.id),
      titulo: 'Novo Utilizador Registado',
      mensagem: `Um novo utilizador foi registado: ${nomeUtilizador || `ID ${idNovoUtilizador}`}. Verifique e aprove o registo.`,
      tipo: TipoNotificacao.NOTIFICACAO_ADMIN,
    });

    res.status(201).json({ enviadas: notificacoes.length, notificacoes });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// GET /api/v1/admin/utilizadores/pendentes-aprovacao - utilizadores inactivos/pendentes
roteador.get('/utilizadores/pendentes-aprovacao', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Listar utilizadores pendentes de aprovação (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const pendentes = await repositorioUsuario().find({ where: { ativo: false } });
    res.json({ utilizadores: pendentes.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone,
      perfil: u.perfil,
      criadoEm: u.criadoEm,
    })) });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PUT /api/v1/admin/utilizadores/:id/aprovar - aprovar utilizador
roteador.put('/utilizadores/:id/aprovar', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Aprovar utilizador (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuario = await repositorioUsuario().findOne({ where: { id: Number(req.params.id) } });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    usuario.ativo = true;
    await repositorioUsuario().save(usuario);

    await notificacaoServico.criar({
      idDestinatario: usuario.id,
      titulo: 'Conta Aprovada',
      mensagem: 'A sua conta foi aprovada. Já pode aceder à plataforma.',
      tipo: TipoNotificacao.NOTIFICACAO_ADMIN,
    });

    res.json({ mensagem: 'Utilizador aprovado com sucesso', utilizador: { id: usuario.id, nome: usuario.nome, ativo: usuario.ativo } });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/admin/utilizadores/:id/rejeitar - rejeitar/desactivar utilizador
roteador.put('/utilizadores/:id/rejeitar', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Rejeitar/desactivar utilizador (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuario = await repositorioUsuario().findOne({ where: { id: Number(req.params.id) } });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    usuario.ativo = false;
    await repositorioUsuario().save(usuario);

    await notificacaoServico.criar({
      idDestinatario: usuario.id,
      titulo: 'Conta Rejeitada',
      mensagem: 'O seu pedido de registo não foi aprovado. Contacte o suporte para mais informações.',
      tipo: TipoNotificacao.NOTIFICACAO_ADMIN,
    });

    res.json({ mensagem: 'Utilizador rejeitado com sucesso', utilizador: { id: usuario.id, nome: usuario.nome, ativo: usuario.ativo } });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/admin/notificacoes/:id - ADMIN
roteador.delete('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Remover notificação via painel admin'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await notificacaoServico.remover(Number(req.params.id));
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
