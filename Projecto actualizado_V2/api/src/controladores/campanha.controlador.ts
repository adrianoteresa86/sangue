import { Router, Request, Response } from 'express';
import { campanhaServico } from '../servicos/campanha.servico';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// GET /api/v1/campanhas - público
roteador.get('/', autenticacaoIntermediario, async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Listar todas as campanhas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await campanhaServico.buscarTodas());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/campanhas/activas - público
roteador.get('/activas', async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Listar campanhas activas'
  */
  try {
    res.json(await campanhaServico.buscarAtivas());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/campanhas/hemocentro/:idHemocentro
roteador.get('/hemocentro/:idHemocentro', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Listar campanhas por hemocentro'
  */
  try {
    res.json(await campanhaServico.buscarPorHemocentro(Number(req.params.idHemocentro)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/campanhas/:id - público
roteador.get('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Obter campanha por ID'
  */
  try {
    res.json(await campanhaServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/campanhas - ADMIN e FUNCIONARIO_HEMOCENTRO
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Criar campanha (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['titulo', 'dataInicio', 'dataFim', 'metaDoacoes', 'idHemocentro'],
             properties: {
               titulo: { type: 'string', example: 'Campanha de Doação de Sangue - Junho 2024' },
               descricao: { type: 'string', example: 'Campanha especial para reforço do estoque de sangue' },
               dataInicio: { type: 'string', format: 'date', example: '2024-06-01' },
               dataFim: { type: 'string', format: 'date', example: '2024-06-30' },
               tipoSanguineo: { type: 'string', example: 'O-', description: 'Tipo sanguíneo alvo (opcional)' },
               metaDoacoes: { type: 'integer', example: 100 },
               idHemocentro: { type: 'integer', example: 1 }
             }
           }
         }
       }
     }
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const corpo = req.body;
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      corpo.idHemocentro = usuarioLogado.hemocentroId;
    }
    const campanha = await campanhaServico.criar(corpo);
    res.status(201).json(campanha);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/campanhas/:id - ADMIN
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Actualizar campanha (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               titulo: { type: 'string', example: 'Campanha de Doação de Sangue - Junho 2024' },
               descricao: { type: 'string', example: 'Campanha especial para reforço do estoque de sangue' },
               dataInicio: { type: 'string', format: 'date', example: '2024-06-01' },
               dataFim: { type: 'string', format: 'date', example: '2024-06-30' },
               tipoSanguineo: { type: 'string', example: 'O-' },
               metaDoacoes: { type: 'integer', example: 100 },
               ativo: { type: 'boolean', example: true }
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
      const existente = await campanhaServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar campanha de outro hemocentro' });
      }
      req.body.idHemocentro = usuarioLogado.hemocentroId;
    }
    res.json(await campanhaServico.atualizar(id, req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/campanhas/:id/status - ADMIN
roteador.patch('/:id/status', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Alternar status da campanha (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status'],
             properties: {
               status: { type: 'boolean', example: false }
             }
           }
         }
       }
     }
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if (req.body.status === undefined) {
      res.status(400).json({ erro: 'O campo status é obrigatório' });
      return;
    }
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await campanhaServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar campanha de outro hemocentro' });
      }
    }
    const campanha = await campanhaServico.atualizar(id, { ativo: Boolean(req.body.status) });
    res.json(campanha);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/campanhas/:id - ADMIN
roteador.delete('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Campanhas']
     #swagger.summary = 'Remover campanha (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await campanhaServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode remover campanha de outro hemocentro' });
      }
    }
    await campanhaServico.remover(id);
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
