import { Router, Request, Response } from 'express';
import { hemocentroServico } from '../servicos/hemocentro.servico';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// GET /api/v1/hemocentros - público
roteador.get('/', async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Listar todos os hemocentros'
  */
  try {
    const lista = await hemocentroServico.buscarTodos();
    res.json(lista);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/hemocentros/activos - público
roteador.get('/activos', async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Listar hemocentros activos'
  */
  try {
    const lista = await hemocentroServico.buscarAtivos();
    res.json(lista);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/hemocentros/:id - público
roteador.get('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Obter hemocentro por ID'
  */
  try {
    const hemocentro = await hemocentroServico.buscarPorId(Number(req.params.id));
    res.json(hemocentro);
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/hemocentros - ADMIN
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Criar hemocentro (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['nome'],
             properties: {
               nome: { type: 'string', example: 'Hemocentro Central de Maputo' },
               endereco: { type: 'string', example: 'Av. Eduardo Mondlane, 123' },
               cidade: { type: 'string', example: 'Maputo' },
               estado: { type: 'string', example: 'Maputo' },
               telefone: { type: 'string', example: '+258211234567' },
               email: { type: 'string', example: 'hemocentro@saude.gov.mz' },
               horarioFuncionamento: { type: 'string', example: 'Seg-Sex 07:00-17:00' },
               descricao: { type: 'string', example: 'Centro de colheita e distribuição de sangue' },
               latitude: { type: 'number', example: -25.9692 },
               longitude: { type: 'number', example: 32.5732 },
               ativo: { type: 'boolean', example: true }
             }
           }
         }
       }
     }
  */
  try {
    const hemocentro = await hemocentroServico.criar(req.body);
    res.status(201).json(hemocentro);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/hemocentros/:id - ADMIN
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Actualizar hemocentro (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               nome: { type: 'string', example: 'Hemocentro Central de Maputo' },
               endereco: { type: 'string', example: 'Av. Eduardo Mondlane, 123' },
               cidade: { type: 'string', example: 'Maputo' },
               estado: { type: 'string', example: 'Maputo' },
               telefone: { type: 'string', example: '+258211234567' },
               email: { type: 'string', example: 'hemocentro@saude.gov.mz' },
               horarioFuncionamento: { type: 'string', example: 'Seg-Sex 07:00-17:00' },
               descricao: { type: 'string', example: 'Centro de colheita e distribuição de sangue' },
               latitude: { type: 'number', example: -25.9692 },
               longitude: { type: 'number', example: 32.5732 },
               ativo: { type: 'boolean', example: true }
             }
           }
         }
       }
     }
  */
  try {
    const hemocentro = await hemocentroServico.atualizar(Number(req.params.id), req.body);
    res.json(hemocentro);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/hemocentros/:id/status - ADMIN
roteador.patch('/:id/status', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Alternar status do hemocentro (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['ativo'],
             properties: {
               ativo: { type: 'boolean', example: false }
             }
           }
         }
       }
     }
  */
  try {
    if (req.body.ativo === undefined) {
      res.status(400).json({ erro: 'O campo ativo é obrigatório' });
      return;
    }
    const hemocentro = await hemocentroServico.atualizar(Number(req.params.id), { ativo: Boolean(req.body.ativo) });
    res.json(hemocentro);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/hemocentros/:id - ADMIN
roteador.delete('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Hemocentros']
     #swagger.summary = 'Remover hemocentro (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await hemocentroServico.remover(Number(req.params.id));
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
