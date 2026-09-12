import { Router, Request, Response } from 'express';
import { estoqueSangueServico } from '../servicos/estoque-sangue.servico';
import { StatusEstoque } from '../entidades/EstoqueSangue';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// GET /api/v1/estoque-sangue
roteador.get('/', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Listar todo o estoque de sangue'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      if (!usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Funcionário sem hemocentro vinculado' });
      }
      res.json(await estoqueSangueServico.buscarPorHemocentro(usuarioLogado.hemocentroId));
    } else {
      res.json(await estoqueSangueServico.listarTodos());
    }
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estoque-sangue/formatados
roteador.get('/formatados', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Listar todo o estoque de sangue com datas formatadas'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    let dados = await estoqueSangueServico.listarTodosFormatados();
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      dados = dados.filter((item: any) => item.hemocentro?.id === usuarioLogado.hemocentroId);
    }
    res.json(dados);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estoque-sangue/status/:status
roteador.get('/status/:status', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Listar estoque por status'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['status'] = {
        in: 'path',
        description: 'Status do estoque',
        required: true,
        enum: ['Adequado', 'Baixo', 'Crítico']
     }
  */
  try {
    const { status } = req.params;
    
    // Validar se o status é válido
    if (!Object.values(StatusEstoque).includes(status as StatusEstoque)) {
      return res.status(400).json({ erro: 'Status inválido. Use: Adequado, Baixo ou Crítico' });
    }

    const usuarioLogado = (req as any).usuario;
    let todos = await estoqueSangueServico.listarTodos();
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      todos = todos.filter((item: any) => item.hemocentro?.id === usuarioLogado.hemocentroId);
    }
    const filtrados = todos.filter(item => item.status === status);
    
    res.json(filtrados);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estoque-sangue/vencendo-em-breve
roteador.get('/vencendo-em-breve', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Listar unidades de sangue a vencer em breve'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    let dados = await estoqueSangueServico.buscarVencendoEmBreve();
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      dados = dados.filter((item: any) => item.hemocentro?.id === usuarioLogado.hemocentroId);
    }
    res.json(dados);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estoque-sangue/hemocentro/:idHemocentro
roteador.get('/hemocentro/:idHemocentro', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Listar estoque por hemocentro'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await estoqueSangueServico.buscarPorHemocentro(Number(req.params.idHemocentro)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estoque-sangue/hemocentro/:idHemocentro/disponiveis
roteador.get('/hemocentro/:idHemocentro/disponiveis', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Listar unidades disponíveis por hemocentro'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await estoqueSangueServico.buscarDisponiveisPorHemocentro(Number(req.params.idHemocentro)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/estoque-sangue/:id
roteador.get('/:id', autenticacaoIntermediario, async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Obter unidade de sangue por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await estoqueSangueServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/estoque-sangue
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Adicionar unidade ao estoque'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idHemocentro', 'tipoSangue', 'quantidade', 'tipoComponente', 'dataValidade'],
             properties: {
               idHemocentro: { type: 'integer', example: 1 },
               tipoSangue: { type: 'string', example: 'O+', description: 'Ex: A+, B-, O+, AB-' },
               quantidade: { type: 'number', example: 500, description: 'Quantidade em ml' },
               tipoComponente: { type: 'string', example: 'Sangue Total', description: 'Ex: Sangue Total, Plasma, Plaquetas' },
               dataValidade: { type: 'string', format: 'date', example: '2024-12-31' },
               dataRecebimento: { type: 'string', format: 'date', example: '2024-06-01' }
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
    const estoque = await estoqueSangueServico.criar(corpo);
    res.status(201).json(estoque);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/estoque-sangue/:id
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Actualizar unidade do estoque'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               idHemocentro: { type: 'integer', example: 1 },
               tipoSangue: { type: 'string', example: 'O+' },
               quantidade: { type: 'number', example: 500 },
               tipoComponente: { type: 'string', example: 'Sangue Total' },
               dataValidade: { type: 'string', format: 'date', example: '2024-12-31' }
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
      const existente = await estoqueSangueServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar estoque de outro hemocentro' });
      }
      req.body.idHemocentro = usuarioLogado.hemocentroId;
    }
    res.json(await estoqueSangueServico.atualizar(id, req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/estoque-sangue/:id/indisponivel
roteador.patch('/:id/indisponivel', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Marcar unidade como indisponível'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await estoqueSangueServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar estoque de outro hemocentro' });
      }
    }
    await estoqueSangueServico.marcarComoIndisponivel(id);
    res.json({ mensagem: 'Marcado como indisponível' });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/estoque-sangue/:id/diminuir
roteador.patch('/:id/diminuir', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Diminuir quantidade do estoque'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['quantidade'],
             properties: {
               quantidade: { type: 'number', example: 100, description: 'Quantidade a diminuir (em ml)' }
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
      const existente = await estoqueSangueServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar estoque de outro hemocentro' });
      }
    }
    await estoqueSangueServico.diminuirQuantidade(id, req.body.quantidade);
    res.json({ mensagem: 'Quantidade diminuída' });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/estoque-sangue/:id
roteador.delete('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Estoque de Sangue']
     #swagger.summary = 'Remover unidade do estoque'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await estoqueSangueServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode remover estoque de outro hemocentro' });
      }
    }
    await estoqueSangueServico.remover(id);
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
