import { Router, Response } from 'express';
import { receptorServico } from '../servicos/receptor.servico';
import { autenticacaoIntermediario, RequisicaoAutenticada } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// Todas as rotas exigem autenticação e perfil RECEPTOR
roteador.use(autenticacaoIntermediario, exigirPerfil(PerfilUsuario.RECEPTOR));

// GET /api/v1/receptor/dashboard
roteador.get('/dashboard', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Dashboard do receptor com estatísticas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    res.json(await receptorServico.dashboard(idUsuario));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/receptor/perfil
roteador.get('/perfil', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Obter perfil completo do receptor (dados pessoais + médicos)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const { usuario, perfilReceptor } = await receptorServico.obterPerfil(idUsuario);
    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      rua: usuario.rua,
      numero: usuario.numero,
      bairro: usuario.bairro,
      provincia: usuario.provincia,
      perfilMedico: perfilReceptor,
    });
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// PUT /api/v1/receptor/perfil
roteador.put('/perfil', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Actualizar perfil do receptor (dados pessoais + médicos)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               nome: { type: 'string', example: 'Maria Silva' },
               email: { type: 'string', example: 'maria@email.com' },
               telefone: { type: 'string', example: '+258841234567' },
               rua: { type: 'string', example: 'Av. Eduardo Mondlane' },
               numero: { type: 'string', example: '100' },
               bairro: { type: 'string', example: 'Sommerschield' },
               provincia: { type: 'string', example: 'Maputo' },
               dataNascimento: { type: 'string', format: 'date', example: '1990-05-15' },
               tipoSanguineo: { type: 'string', example: 'O-' },
               peso: { type: 'number', example: 65.5 },
               altura: { type: 'number', example: 165 },
               historicoMedico: { type: 'string', example: 'Hipertensão controlada' },
               genero: { type: 'string', example: 'F' }
             }
           }
         }
       }
     }
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const result = await receptorServico.atualizarPerfil(idUsuario, req.body);
    res.json({
      mensagem: 'Perfil actualizado com sucesso',
      usuario: {
        id: result.usuario.id,
        nome: result.usuario.nome,
        email: result.usuario.email,
        telefone: result.usuario.telefone,
        rua: result.usuario.rua,
        numero: result.usuario.numero,
        bairro: result.usuario.bairro,
        provincia: result.usuario.provincia,
      },
      perfilMedico: result.perfilReceptor,
    });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// GET /api/v1/receptor/meus-pedidos
roteador.get('/meus-pedidos', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Listar todos os pedidos de transfusão do receptor autenticado'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    res.json(await receptorServico.meusPedidos(idUsuario));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// POST /api/v1/receptor/solicitar
roteador.post('/solicitar', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Criar pedido de transfusão simplificado (formulário do receptor)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['tipoSangue', 'volume', 'urgencia', 'motivo'],
             properties: {
               tipoSangue: { type: 'string', example: 'O-' },
               volume: { type: 'number', example: 500, description: 'Volume em mL' },
               urgencia: { type: 'string', enum: ['normal', 'media', 'urgente', 'critica'], example: 'urgente' },
               motivo: { type: 'string', example: 'Cirurgia programada' },
               observacoes: { type: 'string', example: 'Sem intolerâncias conhecidas' },
               idHemocentro: { type: 'integer', example: 1 },
               precisaAte: { type: 'string', format: 'date-time', example: '2026-05-10T18:00:00Z' }
             }
           }
         }
       }
     }
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const { tipoSangue, volume, urgencia, motivo, observacoes, idHemocentro, precisaAte, urlDocumentoAutorizacao } = req.body;

    if (!tipoSangue || !volume || !urgencia || !motivo) {
      res.status(400).json({ erro: 'tipoSangue, volume, urgencia e motivo são obrigatórios' });
      return;
    }
    if (!urlDocumentoAutorizacao) {
      res.status(400).json({ erro: 'É obrigatório anexar o documento de autorização assinado pelo técnico de saúde' });
      return;
    }

    const pedido = await receptorServico.criarPedidoSimplificado(idUsuario, {
      tipoSangue,
      volume: Number(volume),
      urgencia,
      motivo,
      observacoes,
      idHemocentro: idHemocentro ? Number(idHemocentro) : undefined,
      precisaAte: precisaAte ? new Date(precisaAte) : undefined,
      urlDocumentoAutorizacao,
    });

    res.status(201).json(pedido);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// GET /api/v1/receptor/pedidos/:id
roteador.get('/pedidos/:id', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Ver detalhes de um pedido de transfusão específico'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const idPedido = Number(req.params.id);
    res.json(await receptorServico.obterPedido(idUsuario, idPedido));
  } catch (erro: any) {
    const status = erro.message.includes('permissão') ? 403 : 404;
    res.status(status).json({ erro: erro.message });
  }
});

// PUT /api/v1/receptor/pedidos/:id
roteador.put('/pedidos/:id', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Editar pedido de transfusão pendente'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               tipoSangue: { type: 'string', example: 'A+' },
               volume: { type: 'number', example: 500 },
               urgencia: { type: 'string', enum: ['normal', 'media', 'urgente', 'critica'], example: 'urgente' },
               motivo: { type: 'string', example: 'Cirurgia programada' },
               observacoes: { type: 'string', example: 'Sem intolerâncias conhecidas' },
               idHemocentro: { type: 'integer', example: 1 },
               precisaAte: { type: 'string', format: 'date-time', example: '2026-05-20T18:00:00Z' }
             }
           }
         }
       }
     }
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const idPedido = Number(req.params.id);
    const { tipoSangue, volume, urgencia, motivo, observacoes, idHemocentro, precisaAte } = req.body;
    const pedido = await receptorServico.atualizarPedido(idUsuario, idPedido, {
      tipoSangue,
      volume: volume != null ? Number(volume) : undefined,
      urgencia,
      motivo,
      observacoes,
      idHemocentro: idHemocentro != null ? Number(idHemocentro) : undefined,
      precisaAte: precisaAte ? new Date(precisaAte) : undefined,
    });
    res.json({ mensagem: 'Pedido actualizado com sucesso', pedido });
  } catch (erro: any) {
    const status = erro.message.includes('permissão') ? 403 : 400;
    res.status(status).json({ erro: erro.message });
  }
});

// PATCH /api/v1/receptor/pedidos/:id/cancelar
roteador.patch('/pedidos/:id/cancelar', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Cancelar pedido de transfusão próprio (apenas status Pendente)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const idPedido = Number(req.params.id);
    res.json(await receptorServico.cancelarPedido(idUsuario, idPedido));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// GET /api/v1/receptor/historico
roteador.get('/historico', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Histórico de transfusões concluídas do receptor com estatísticas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    res.json(await receptorServico.historico(idUsuario));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/receptor/hemocentros
roteador.get('/hemocentros', async (_req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Listar hemocentros activos disponíveis para seleccionar na solicitação'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await receptorServico.listarHemocentros());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/receptor/notificacoes
roteador.get('/notificacoes', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Listar todas as notificações do receptor com contagem de não lidas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    res.json(await receptorServico.listarNotificacoes(idUsuario));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PATCH /api/v1/receptor/notificacoes/ler-todas
roteador.patch('/notificacoes/ler-todas', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Marcar todas as notificações como lidas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    await receptorServico.marcarTodasNotificacoesLidas(idUsuario);
    res.json({ mensagem: 'Todas as notificações foram marcadas como lidas' });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PATCH /api/v1/receptor/notificacoes/:id/ler
roteador.patch('/notificacoes/:id/ler', async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Receptor']
     #swagger.summary = 'Marcar uma notificação específica como lida'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const idNotificacao = Number(req.params.id);
    res.json(await receptorServico.marcarNotificacaoLida(idUsuario, idNotificacao));
  } catch (erro: any) {
    const status = erro.message.includes('permissão') ? 403 : 404;
    res.status(status).json({ erro: erro.message });
  }
});

export default roteador;
