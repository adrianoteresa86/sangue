import { Router, Request, Response } from 'express';
import { notificacaoServico } from '../servicos/notificacao.servico';
import { autenticacaoIntermediario, RequisicaoAutenticada } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';

const roteador = Router();

// GET /api/v1/notificacoes - ADMIN: listar todas
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar todas as notificações (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarTodas());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/minhas
roteador.get('/minhas', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar as minhas notificações'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarPorUsuario(Number(req.usuario!.sub)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/minhas/nao-lidas
roteador.get('/minhas/nao-lidas', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar as minhas notificações não lidas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarNaoLidasPorUsuario(Number(req.usuario!.sub)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/minhas/contagem-nao-lidas
roteador.get('/minhas/contagem-nao-lidas', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Contar notificações não lidas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const contagem = await notificacaoServico.contarNaoLidas(Number(req.usuario!.sub));
    res.json({ contagem });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/tipo/:tipo - ADMIN
roteador.get('/tipo/:tipo', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar notificações por tipo (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const tipo = req.params.tipo as TipoNotificacao;
    res.json(await notificacaoServico.buscarPorTipo(tipo));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/entidade/:tipo/:id - ADMIN
roteador.get('/entidade/:tipo/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar notificações por entidade relacionada (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarPorEntidadeRelacionada(req.params.tipo, Number(req.params.id)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/expiradas - ADMIN
roteador.get('/expiradas', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Listar notificações expiradas (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarExpiradas());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/lembrete-doacao - ADMIN
roteador.post('/lembrete-doacao', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Enviar lembrete de doação (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idDoador', 'dataDoacao', 'nomeHemocentro'],
             properties: {
               idDoador: { type: 'integer', example: 1 },
               dataDoacao: { type: 'string', format: 'date-time', example: '2024-06-20T08:00:00Z' },
               nomeHemocentro: { type: 'string', example: 'Hemocentro Central de Maputo' }
             }
           }
         }
       }
     }
  */
  try {
    const { idDoador, dataDoacao, nomeHemocentro } = req.body;
    const notificacao = await notificacaoServico.criarLembreteDoacao({
      idDoador: Number(idDoador),
      dataDoacao: new Date(dataDoacao),
      nomeHemocentro,
    });
    res.status(201).json(notificacao);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/doacao-confirmada - ADMIN
roteador.post('/doacao-confirmada', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Enviar confirmação de doação (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idDoador', 'dataDoacao', 'nomeHemocentro'],
             properties: {
               idDoador: { type: 'integer', example: 1 },
               dataDoacao: { type: 'string', format: 'date-time', example: '2024-06-15T09:00:00Z' },
               nomeHemocentro: { type: 'string', example: 'Hemocentro Central de Maputo' }
             }
           }
         }
       }
     }
  */
  try {
    const { idDoador, dataDoacao, nomeHemocentro } = req.body;
    const notificacao = await notificacaoServico.criarDoacaoConfirmada({
      idDoador: Number(idDoador),
      dataDoacao: new Date(dataDoacao),
      nomeHemocentro,
    });
    res.status(201).json(notificacao);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/urgencia-sangue - ADMIN
roteador.post('/urgencia-sangue', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Enviar alerta de urgência de sangue (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idsDestinatarios', 'tipoSangue', 'nomeHemocentro'],
             properties: {
               idsDestinatarios: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
               tipoSangue: { type: 'string', example: 'O-' },
               nomeHemocentro: { type: 'string', example: 'Hemocentro Central de Maputo' }
             }
           }
         }
       }
     }
  */
  try {
    const { idsDestinatarios, tipoSangue, nomeHemocentro } = req.body;
    const notificacoes = await notificacaoServico.criarUrgenciaSangue({
      idsDestinatarios: idsDestinatarios.map(Number),
      tipoSangue,
      nomeHemocentro,
    });
    res.status(201).json({ enviadas: notificacoes.length, notificacoes });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/resultado-teste - ADMIN
roteador.post('/resultado-teste', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Enviar resultado de teste ao doador (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idDoador', 'idTeste', 'resultado'],
             properties: {
               idDoador: { type: 'integer', example: 1 },
               idTeste: { type: 'integer', example: 10 },
               resultado: { type: 'string', example: 'Negativo para HIV, Hepatite B e C' }
             }
           }
         }
       }
     }
  */
  try {
    const { idDoador, idTeste, resultado } = req.body;
    const notificacao = await notificacaoServico.criarResultadosTeste({
      idDoador: Number(idDoador),
      idTeste: Number(idTeste),
      resultado,
    });
    res.status(201).json(notificacao);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/em-massa-lista - ADMIN
roteador.post('/em-massa-lista', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Enviar notificações em massa por lista (ADMIN)'
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
               titulo: { type: 'string', example: 'Campanha de Junho' },
               mensagem: { type: 'string', example: 'Precisa-se de doadores de sangue tipo O!' },
               tipo: { type: 'string', enum: ['DONATION_REMINDER', 'BLOOD_URGENCY', 'CAMPAIGN_ANNOUNCEMENT', 'ADMIN_NOTIFICATION'], example: 'CAMPAIGN_ANNOUNCEMENT' }
             }
           }
         }
       }
     }
  */
  try {
    const notificacoes = await notificacaoServico.criarEmMassaLista(req.body);
    res.status(201).json({ enviadas: notificacoes.length, notificacoes });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/pedido-sangue
roteador.post('/pedido-sangue', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Notificar doadores sobre pedido de sangue'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idsDoadores', 'tipoSangue', 'idPedido'],
             properties: {
               idsDoadores: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
               tipoSangue: { type: 'string', example: 'O+' },
               idPedido: { type: 'integer', example: 5 }
             }
           }
         }
       }
     }
  */
  try {
    const { idsDoadores, tipoSangue, idPedido } = req.body;
    const notificacoes = await notificacaoServico.criarNotificacaoPedidoSangue({
      idsDoadores: idsDoadores.map(Number),
      tipoSangue,
      idPedido: Number(idPedido),
    });
    res.status(201).json({ enviadas: notificacoes.length, notificacoes });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/agendamento-doacao
roteador.post('/agendamento-doacao', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Notificar doador sobre agendamento'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idDoador', 'idAgendamento', 'dataAgendamento', 'nomeHemocentro'],
             properties: {
               idDoador: { type: 'integer', example: 1 },
               idAgendamento: { type: 'integer', example: 7 },
               dataAgendamento: { type: 'string', format: 'date-time', example: '2024-06-20T08:00:00Z' },
               nomeHemocentro: { type: 'string', example: 'Hemocentro Central de Maputo' }
             }
           }
         }
       }
     }
  */
  try {
    const { idDoador, idAgendamento, dataAgendamento, nomeHemocentro } = req.body;
    const notificacao = await notificacaoServico.criarNotificacaoAgendamentoDoacao({
      idDoador: Number(idDoador),
      idAgendamento: Number(idAgendamento),
      dataAgendamento: new Date(dataAgendamento),
      nomeHemocentro,
    });
    res.status(201).json(notificacao);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/notificacoes/resposta/:id
roteador.post('/resposta/:id', autenticacaoIntermediario, async (req, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Responder a uma notificação'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['resposta'],
             properties: {
               resposta: { type: 'string', example: 'Confirmo que estarei presente.' }
             }
           }
         }
       }
     }
  */
  try {
    const autReq = req as RequisicaoAutenticada;
    const notificacao = await notificacaoServico.criarRespostaNotificacao(Number(req.params.id), {
      idRemetente: Number(autReq.usuario!.sub),
      resposta: req.body.resposta,
    });
    res.status(201).json(notificacao);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/notificacoes/:id/lida
roteador.patch('/:id/lida', autenticacaoIntermediario, async (req, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Marcar notificação como lida'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const autReq = req as RequisicaoAutenticada;
    res.json(await notificacaoServico.marcarComoLida(Number(req.params.id), Number(autReq.usuario!.sub)));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/notificacoes/minhas/marcar-todas-lidas
roteador.patch('/minhas/marcar-todas-lidas', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Marcar todas as minhas notificações como lidas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await notificacaoServico.marcarTodasComoLidas(Number(req.usuario!.sub));
    res.json({ mensagem: 'Todas as notificações marcadas como lidas' });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PUT /api/v1/notificacoes/:id - ADMIN: actualizar notificação
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Actualizar notificação (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               titulo: { type: 'string', example: 'Título actualizado' },
               mensagem: { type: 'string', example: 'Mensagem actualizada' },
               lida: { type: 'boolean', example: true }
             }
           }
         }
       }
     }
  */
  try {
    res.json(await notificacaoServico.atualizar(Number(req.params.id), req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// GET /api/v1/notificacoes/:id
roteador.get('/:id', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Obter notificação por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await notificacaoServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// DELETE /api/v1/notificacoes/expiradas - ADMIN
roteador.delete('/:id', async (_req, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Remover notificações expiradas (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const removidas = await notificacaoServico.removerExpiradas();
    res.json({ mensagem: `${removidas} notificações expiradas removidas` });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// DELETE /api/v1/notificacoes/:id - ADMIN
roteador.delete('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Notificações']
     #swagger.summary = 'Remover notificação (ADMIN)'
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
