import { Router, Request, Response } from 'express';
import { registroTransfusaoServico } from '../servicos/registro-transfusao.servico';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// GET /api/v1/registros-transfusao
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response) => {
  /* #swagger.tags = ['Registos de Transfusão']
     #swagger.summary = 'Listar todos os registos de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroTransfusaoServico.buscarTodos());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-transfusao/hemocentro/:idHemocentro
roteador.get('/hemocentro/:idHemocentro', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Transfusão']
     #swagger.summary = 'Listar registos de transfusão por hemocentro'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroTransfusaoServico.buscarPorHemocentro(Number(req.params.idHemocentro)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-transfusao/pedido/:idPedido
roteador.get('/pedido/:idPedido', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    const registro = await registroTransfusaoServico.buscarPorPedido(Number(req.params.idPedido));
    if (!registro) { res.status(404).json({ erro: 'Nenhum registo encontrado para este pedido' }); return; }
    res.json(registro);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-transfusao/:id
roteador.get('/:id', autenticacaoIntermediario, async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Transfusão']
     #swagger.summary = 'Obter registo de transfusão por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroTransfusaoServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/registros-transfusao
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Registos de Transfusão']
     #swagger.summary = 'Criar registo de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idPedido', 'idHemocentro', 'idEstoqueSangue', 'quantidadeAdministrada', 'tipoSangue', 'tipoComponente', 'prePressaoSistolica', 'prePressaoDiastolica', 'prePulso', 'preTemperatura', 'preFrequenciaRespiratoria'],
             properties: {
               idPedido: { type: 'integer', example: 1 },
               idHemocentro: { type: 'integer', example: 1 },
               idEstoqueSangue: { type: 'integer', example: 3 },
               dataTransfusao: { type: 'string', format: 'date-time', example: '2024-06-16T10:00:00Z' },
               horaInicio: { type: 'string', format: 'date-time', example: '2024-06-16T10:00:00Z' },
               horaFim: { type: 'string', format: 'date-time', example: '2024-06-16T11:30:00Z' },
               quantidadeAdministrada: { type: 'number', example: 450 },
               tipoSangue: { type: 'string', example: 'A+' },
               tipoComponente: { type: 'string', example: 'Concentrado de Hemácias' },
               prePressaoSistolica: { type: 'number', example: 120 },
               prePressaoDiastolica: { type: 'number', example: 80 },
               prePulso: { type: 'number', example: 72 },
               preTemperatura: { type: 'number', example: 36.5 },
               preFrequenciaRespiratoria: { type: 'number', example: 16 },
               durantePressaoSistolica: { type: 'number', example: 118 },
               durantePressaoDiastolica: { type: 'number', example: 78 },
               durantePulso: { type: 'number', example: 74 },
               duranteTemperatura: { type: 'number', example: 36.6 },
               posPressaoSistolica: { type: 'number', example: 122 },
               posPressaoDiastolica: { type: 'number', example: 82 },
               posPulso: { type: 'number', example: 70 },
               posTemperatura: { type: 'number', example: 36.5 },
               posFrequenciaRespiratoria: { type: 'number', example: 15 },
               reacaoAdversa: { type: 'boolean', example: false },
               descricaoReacaoAdversa: { type: 'string', example: '' },
               concluida: { type: 'boolean', example: true },
               complicacoes: { type: 'string', example: '' },
               observacoes: { type: 'string', example: 'Sem intercorrências' },
               idEnfermeiro: { type: 'integer', example: 2 },
               idMedico: { type: 'integer', example: 3 },
               idReceptor: { type: 'integer', example: 5 }
             }
           }
         }
       }
     }
  */
  try {
    const registro = await registroTransfusaoServico.criar(req.body);
    res.status(201).json(registro);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/registros-transfusao/:id
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Transfusão']
     #swagger.summary = 'Actualizar registo de transfusão'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               quantidadeAdministrada: { type: 'number', example: 450 },
               reacaoAdversa: { type: 'boolean', example: false },
               descricaoReacaoAdversa: { type: 'string', example: '' },
               concluida: { type: 'boolean', example: true },
               complicacoes: { type: 'string', example: '' },
               observacoes: { type: 'string', example: 'Sem intercorrências' }
             }
           }
         }
       }
     }
  */
  try {
    res.json(await registroTransfusaoServico.atualizar(Number(req.params.id), req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/registros-transfusao/:id
roteador.delete('/:id', async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Transfusão']
     #swagger.summary = 'Remover registo de transfusão (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await registroTransfusaoServico.remover(Number(req.params.id));
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
