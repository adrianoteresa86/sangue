import { Router, Request, Response } from 'express';
import { pedidoTransfusaoServico } from '../servicos/pedido-transfusao.servico';
import { notificacaoServico } from '../servicos/notificacao.servico';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { StatusTransfusao } from '../utilitarios/status-transfusao.enum';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';

const MENSAGEM_STATUS: Record<StatusTransfusao, { titulo: string; mensagem: (prontuario: string) => string }> = {
  [StatusTransfusao.APROVADA]: {
    titulo: 'Pedido Aprovado',
    mensagem: (p) => `O seu pedido de transfusão (${p}) foi aprovado. Aguarde contacto do hemocentro.`,
  },
  [StatusTransfusao.REJEITADA]: {
    titulo: 'Pedido Rejeitado',
    mensagem: (p) => `O seu pedido de transfusão (${p}) foi rejeitado. Contacte o hemocentro para mais informações.`,
  },
  [StatusTransfusao.EM_ANDAMENTO]: {
    titulo: 'Transfusão em Andamento',
    mensagem: (p) => `A transfusão referente ao pedido (${p}) está em andamento.`,
  },
  [StatusTransfusao.CONCLUIDA]: {
    titulo: 'Transfusão Concluída',
    mensagem: (p) => `A transfusão referente ao pedido (${p}) foi concluída com sucesso.`,
  },
  [StatusTransfusao.CANCELADA]: {
    titulo: 'Pedido Cancelado',
    mensagem: (p) => `O pedido de transfusão (${p}) foi cancelado.`,
  },
  [StatusTransfusao.PENDENTE]: {
    titulo: 'Pedido Pendente',
    mensagem: (p) => `O pedido de transfusão (${p}) está pendente de aprovação.`,
  },
};

const roteador = Router();

// GET /api/v1/pedidos-transfusao
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Listar todos os pedidos de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      if (!usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Funcionário sem hemocentro vinculado' });
      }
      res.json(await pedidoTransfusaoServico.buscarPorHemocentro(usuarioLogado.hemocentroId));
    } else {
      res.json(await pedidoTransfusaoServico.buscarTodos());
    }
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/pedidos-transfusao/pendentes
roteador.get('/pendentes', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Listar pedidos de transfusão pendentes'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    let pendentes = await pedidoTransfusaoServico.buscarPendentes();
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      pendentes = pendentes.filter((p: any) => p.hemocentro?.id === usuarioLogado.hemocentroId);
    }
    res.json(pendentes);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/pedidos-transfusao/hemocentro/:idHemocentro
roteador.get('/hemocentro/:idHemocentro', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Listar pedidos de transfusão por hemocentro'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await pedidoTransfusaoServico.buscarPorHemocentro(Number(req.params.idHemocentro)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/pedidos-transfusao/:id
roteador.get('/:id', autenticacaoIntermediario, async (req, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Obter pedido de transfusão por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await pedidoTransfusaoServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/pedidos-transfusao
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.RECEPTOR), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Criar pedido de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idHemocentro', 'nomePaciente', 'tipoSanguinePaciente', 'idadePaciente', 'generoPaciente', 'numeroProntuario', 'diagnostico', 'tipoComponente', 'quantidadeSolicitada', 'nivelUrgencia', 'precisaAte'],
             properties: {
               idHemocentro: { type: 'integer', example: 1 },
               nomePaciente: { type: 'string', example: 'Carlos Fernandes' },
               tipoSanguinePaciente: { type: 'string', example: 'A+' },
               idadePaciente: { type: 'integer', example: 45 },
               generoPaciente: { type: 'string', example: 'M', description: 'M ou F' },
               numeroProntuario: { type: 'string', example: 'HCM-2024-001234' },
               diagnostico: { type: 'string', example: 'Anemia severa pós-cirúrgica' },
               tipoComponente: { type: 'string', example: 'Concentrado de Hemácias' },
               quantidadeSolicitada: { type: 'number', example: 2, description: 'Número de unidades' },
               nivelUrgencia: { type: 'integer', example: 3, description: '1=Baixa, 2=Média, 3=Alta, 4=Crítica' },
               precisaAte: { type: 'string', format: 'date-time', example: '2024-06-16T18:00:00Z' },
               indicacaoClinica: { type: 'string', example: 'Pós-cirurgia cardíaca' },
               idReceptor: { type: 'integer', example: 5 },
               contatoMedico: { type: 'string', example: '+258841234567' },
               observacoes: { type: 'string', example: 'Paciente alérgico a conservantes' }
             }
           }
         }
       }
     }
  */
  try {
    const pedido = await pedidoTransfusaoServico.criar(req.body);
    res.status(201).json(pedido);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/pedidos-transfusao/:id
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Actualizar pedido de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               nomePaciente: { type: 'string', example: 'Carlos Fernandes' },
               tipoSanguinePaciente: { type: 'string', example: 'A+' },
               idadePaciente: { type: 'integer', example: 45 },
               generoPaciente: { type: 'string', example: 'M' },
               numeroProntuario: { type: 'string', example: 'HCM-2024-001234' },
               diagnostico: { type: 'string', example: 'Anemia severa pós-cirúrgica' },
               tipoComponente: { type: 'string', example: 'Concentrado de Hemácias' },
               quantidadeSolicitada: { type: 'number', example: 2 },
               nivelUrgencia: { type: 'integer', example: 3 },
               precisaAte: { type: 'string', format: 'date-time', example: '2024-06-16T18:00:00Z' },
               indicacaoClinica: { type: 'string', example: 'Pós-cirurgia cardíaca' },
               contatoMedico: { type: 'string', example: '+258841234567' },
               observacoes: { type: 'string', example: '' }
             }
           }
         }
       }
     }
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await pedidoTransfusaoServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar pedido de outro hemocentro' });
      }
      req.body.idHemocentro = usuarioLogado.hemocentroId;
    }
    res.json(await pedidoTransfusaoServico.atualizar(id, req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/pedidos-transfusao/:id/status
roteador.patch('/:id/status', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Actualizar status do pedido de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status'],
             properties: {
               status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], example: 'APPROVED' }
             }
           }
         }
       }
     }
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!Object.values(StatusTransfusao).includes(status)) {
      res.status(400).json({ erro: 'Status inválido' });
      return;
    }
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await pedidoTransfusaoServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar pedido de outro hemocentro' });
      }
    }
    const pedido = await pedidoTransfusaoServico.actualizarStatus(id, status);

    if (pedido.receptor?.id && status !== StatusTransfusao.PENDENTE) {
      const info = MENSAGEM_STATUS[status as StatusTransfusao];
      notificacaoServico.criar({
        idDestinatario: pedido.receptor.id,
        titulo: info.titulo,
        mensagem: info.mensagem(pedido.numeroProntuario),
        tipo: TipoNotificacao.PEDIDO_TRANSFUSAO,
        tipoEntidadeRelacionada: 'pedido_transfusao',
        idEntidadeRelacionada: pedido.id,
      }).catch(() => { /* notificação não crítica */ });
    }

    res.json(pedido);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/pedidos-transfusao/:id
roteador.delete('/:id', async (req, res: Response) => {
  /* #swagger.tags = ['Pedidos de Transfusão']
     #swagger.summary = 'Remover pedido de transfusão (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await pedidoTransfusaoServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode remover pedido de outro hemocentro' });
      }
    }
    await pedidoTransfusaoServico.remover(id);
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
