import { Router, Request, Response } from 'express';
import { registroDoacaoServico } from '../servicos/registro-doacao.servico';
import { autenticacaoIntermediario, RequisicaoAutenticada } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// GET /api/v1/registros-doacao - ADMIN
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (_req, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Listar todos os registos de doação (ADMIN e Hemocentro)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroDoacaoServico.buscarTodos());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-doacao/meus - próprio utilizador
roteador.get('/meus', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Listar os meus registos de doação'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroDoacaoServico.buscarPorDoador(Number(req.usuario!.sub)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-doacao/doador/:idDoador - ADMIN
roteador.get('/doador/:idDoador', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Listar registos de doação por doador'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroDoacaoServico.buscarPorDoador(Number(req.params.idDoador)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-doacao/hemocentro/:idHemocentro
roteador.get('/hemocentro/:idHemocentro', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Listar registos de doação por hemocentro'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroDoacaoServico.buscarPorHemocentro(Number(req.params.idHemocentro)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-doacao/agendamento/:idAgendamento - ADMIN
roteador.get('/agendamento/:idAgendamento', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    const registro = await registroDoacaoServico.buscarPorAgendamento(Number(req.params.idAgendamento));
    if (!registro) return res.status(404).json({ erro: 'Nenhum registro de doação encontrado para este agendamento' });
    res.json(registro);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/registros-doacao/:id
roteador.get('/:id', autenticacaoIntermediario, async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Obter registo de doação por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await registroDoacaoServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/registros-doacao - ADMIN
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Criar registo de doação'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idDoador', 'idHemocentro', 'quantidade', 'tipoSangue', 'tipoComponente', 'nivelHemoglobina', 'pressaoSistolica', 'pressaoDiastolica', 'pulso', 'temperatura', 'peso'],
             properties: {
               idDoador: { type: 'integer', example: 1 },
               idHemocentro: { type: 'integer', example: 1 },
               idAgendamento: { type: 'integer', example: 5 },
               dataDoacao: { type: 'string', format: 'date-time', example: '2024-06-15T09:00:00Z' },
               quantidade: { type: 'number', example: 450, description: 'Quantidade em ml' },
               tipoSangue: { type: 'string', example: 'O+' },
               tipoComponente: { type: 'string', example: 'Sangue Total' },
               nivelHemoglobina: { type: 'number', example: 14.5 },
               pressaoSistolica: { type: 'number', example: 120 },
               pressaoDiastolica: { type: 'number', example: 80 },
               pulso: { type: 'number', example: 72 },
               temperatura: { type: 'number', example: 36.5 },
               peso: { type: 'number', example: 70 },
               observacoes: { type: 'string', example: 'Sem intercorrências' },
               elegivel: { type: 'boolean', example: true },
               motivoInelegibilidade: { type: 'string', example: '' },
               idTecnico: { type: 'integer', example: 2 }
             }
           }
         }
       }
     }
  */
  try {
    const registro = await registroDoacaoServico.criar(req.body);
    res.status(201).json(registro);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/registros-doacao/:id - ADMIN
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Actualizar registo de doação'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               quantidade: { type: 'number', example: 450 },
               tipoSangue: { type: 'string', example: 'O+' },
               tipoComponente: { type: 'string', example: 'Sangue Total' },
               nivelHemoglobina: { type: 'number', example: 14.5 },
               pressaoSistolica: { type: 'number', example: 120 },
               pressaoDiastolica: { type: 'number', example: 80 },
               pulso: { type: 'number', example: 72 },
               temperatura: { type: 'number', example: 36.5 },
               peso: { type: 'number', example: 70 },
               observacoes: { type: 'string', example: 'Sem intercorrências' },
               elegivel: { type: 'boolean', example: true },
               motivoInelegibilidade: { type: 'string', example: '' }
             }
           }
         }
       }
     }
  */
  try {
    res.json(await registroDoacaoServico.atualizar(Number(req.params.id), req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// DELETE /api/v1/registros-doacao/:id - ADMIN
roteador.delete('/:id', async (req, res: Response) => {
  /* #swagger.tags = ['Registos de Doação']
     #swagger.summary = 'Remover registo de doação (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await registroDoacaoServico.remover(Number(req.params.id));
    res.status(204).send();
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
