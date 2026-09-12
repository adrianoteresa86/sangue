import { Router, Response } from 'express';
import { testeSangueServico } from '../servicos/teste-sangue.servico';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

const roteador = Router();

// GET /api/v1/testes-sangue - ADMIN
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response) => {
  try {
    res.json(await testeSangueServico.buscarTodos());
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/testes-sangue/registro/:idRegistro - por registro de doação
roteador.get('/registro/:idRegistro', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    const teste = await testeSangueServico.buscarPorRegistroDoacao(Number(req.params.idRegistro));
    if (!teste) return res.status(404).json({ erro: 'Nenhum teste encontrado para este registro' });
    res.json(teste);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/testes-sangue/agendamento/:idAgendamento - por agendamento
roteador.get('/agendamento/:idAgendamento', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    const teste = await testeSangueServico.buscarPorAgendamento(Number(req.params.idAgendamento));
    if (!teste) return res.status(404).json({ erro: 'Nenhum teste encontrado para este agendamento' });
    res.json(teste);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/testes-sangue/:id
roteador.get('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    res.json(await testeSangueServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/testes-sangue - ADMIN
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    const teste = await testeSangueServico.criar(req.body);
    res.status(201).json(teste);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PUT /api/v1/testes-sangue/:id - ADMIN
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req, res: Response) => {
  try {
    res.json(await testeSangueServico.atualizar(Number(req.params.id), req.body));
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
