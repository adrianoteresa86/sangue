import { Router, Request, Response } from 'express';
import { FonteDados } from '../configuracao/banco';
import { PerfilDoador } from '../entidades/PerfilDoador';
import { Usuario } from '../entidades/Usuario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { autenticacaoIntermediario, RequisicaoAutenticada } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { registroDoacaoServico } from '../servicos/registro-doacao.servico';

const roteador = Router();

const repositorioPerfilDoador = () => FonteDados.getRepository(PerfilDoador);
const repositorioUsuario = () => FonteDados.getRepository(Usuario);

// GET /api/v1/doadores - ADMIN: listar todos os doadores
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req: Request, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Listar todos os doadores (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const perfis = await repositorioPerfilDoador().find({ relations: ['usuario'] });
    res.json(perfis);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/doadores/perfil - obter perfil do próprio utilizador
roteador.get('/perfil', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Obter o meu perfil de doador'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  const idUsuario = Number(req.usuario!.sub);

  try {
    const usuario = await repositorioUsuario().findOne({ where: { id: idUsuario } });

    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    const perfil = await repositorioPerfilDoador().findOne({
      where: { usuario: { id: idUsuario } },
    });

    const { senha: _, ...dadosUsuario } = usuario as any;

    res.json({
      ...dadosUsuario,
      perfilDoador: perfil
        ? { id: perfil.id, tipoSangue: perfil.tipoSangue, idade: perfil.idade, peso: perfil.peso }
        : null,
    });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/doadores/verificar-perfis - ADMIN
roteador.get('/verificar-perfis', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Verificar doadores sem perfil (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const perfis = await repositorioPerfilDoador().find({ relations: ['usuario'] });
    const utilizadoresDoadores = await repositorioUsuario().find({ where: { perfil: PerfilUsuario.DOADOR } });

    res.json({
      totalUtilizadores: utilizadoresDoadores.length,
      totalPerfis: perfis.length,
      utilizadoresSemPerfil: utilizadoresDoadores.length - perfis.length,
    });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/doadores/:id/doacoes - histórico de doações de um doador
roteador.get('/:id/doacoes', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Histórico de doações de um doador'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  const idDoador = Number(req.params.id);
  const idSolicitante = Number(req.usuario!.sub);
  const perfilSolicitante = req.usuario!.perfil;

  const podeAceder =
    perfilSolicitante === PerfilUsuario.ADMIN ||
    idSolicitante === idDoador;

  if (!podeAceder) {
    res.status(403).json({ erro: 'Acesso negado' });
    return;
  }

  try {
    const doacoes = await registroDoacaoServico.buscarPorDoador(idDoador);
    res.json(doacoes);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/doadores/:id - ADMIN: obter doador por ID
roteador.get('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Obter doador por ID (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const perfil = await repositorioPerfilDoador().findOne({
      where: { id: Number(req.params.id) },
      relations: ['usuario'],
    });

    if (!perfil) {
      res.status(404).json({ erro: 'Doador não encontrado' });
      return;
    }

    res.json(perfil);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// POST /api/v1/doadores - ADMIN: criar perfil de doador
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Criar perfil de doador (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idUsuario', 'tipoSangue'],
             properties: {
               idUsuario: { type: 'integer', example: 1 },
               tipoSangue: { type: 'string', example: 'O+', description: 'Tipo sanguíneo (ex: A+, B-, O+, AB-)' },
               idade: { type: 'number', example: 28, description: 'Idade entre 18 e 65 anos' },
               peso: { type: 'number', example: 70, description: 'Peso mínimo de 50kg' }
             }
           }
         }
       }
     }
  */
  const { idUsuario, idade, peso, tipoSangue } = req.body;

  if (!idUsuario || !tipoSangue || !tipoSangue.trim()) {
    res.status(400).json({ erro: 'ID do usuário e tipo sanguíneo são obrigatórios' });
    return;
  }

  if (idade !== undefined && idade !== null && (idade < 18 || idade > 65)) {
    res.status(400).json({ erro: 'Idade deve ser entre 18 e 65 anos' });
    return;
  }

  if (peso !== undefined && peso !== null && peso < 50) {
    res.status(400).json({ erro: 'Peso deve ser de pelo menos 50kg' });
    return;
  }

  try {
    const usuario = await repositorioUsuario().findOne({ where: { id: idUsuario } });
    if (!usuario) {
      res.status(404).json({ erro: 'Usuário não encontrado' });
      return;
    }

    const perfilExistente = await repositorioPerfilDoador().findOne({ where: { usuario: { id: idUsuario } } });
    if (perfilExistente) {
      res.status(400).json({ erro: 'Perfil de doador já existe para este usuário' });
      return;
    }

    const perfil = new PerfilDoador();
    perfil.usuario = usuario;
    perfil.idade = idade;
    perfil.peso = peso;
    perfil.tipoSangue = tipoSangue;

    const perfilSalvo = await repositorioPerfilDoador().save(perfil);
    res.status(201).json(perfilSalvo);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PUT /api/v1/doadores/meu-perfil - DOADOR: actualizar os próprios dados completos
roteador.put('/meu-perfil', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  const idUsuario = Number(req.usuario!.sub);

  const { nome, email, telefone, rua, numero, bairro, provincia, idade, peso, tipoSangue, genero } = req.body;

  if (idade !== undefined && idade !== null && (idade < 18 || idade > 65)) {
    res.status(400).json({ erro: 'Idade deve ser entre 18 e 65 anos' });
    return;
  }

  if (peso !== undefined && peso !== null && peso < 50) {
    res.status(400).json({ erro: 'Peso deve ser de pelo menos 50kg' });
    return;
  }

  try {
    const existe = await repositorioUsuario().count({ where: { id: idUsuario } });
    if (!existe) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    // UPDATE directo — evita problemas de change-detection do TypeORM
    const camposUsuario: Record<string, string> = {};
    if (nome?.trim()) camposUsuario.nome = nome.trim();
    if (email?.trim()) camposUsuario.email = email.trim();
    if (telefone !== undefined) camposUsuario.telefone = telefone;
    if (rua !== undefined) camposUsuario.rua = rua;
    if (numero !== undefined) camposUsuario.numero = numero;
    if (bairro !== undefined) camposUsuario.bairro = bairro;
    if (provincia !== undefined) camposUsuario.provincia = provincia;

    if (Object.keys(camposUsuario).length > 0) {
      await repositorioUsuario().update(idUsuario, camposUsuario);
    }

    // Perfil de doador
    let perfil = await repositorioPerfilDoador().findOne({ where: { usuario: { id: idUsuario } } });
    if (!perfil) {
      const usuario = await repositorioUsuario().findOne({ where: { id: idUsuario } });
      perfil = new PerfilDoador();
      perfil.usuario = usuario!;
    }
    if (idade !== undefined) perfil.idade = idade;
    if (peso !== undefined) perfil.peso = peso;
    if (tipoSangue !== undefined && tipoSangue !== '') perfil.tipoSangue = tipoSangue;
    if (genero !== undefined && genero !== '') perfil.genero = genero;
    await repositorioPerfilDoador().save(perfil);

    res.json({ mensagem: 'Perfil actualizado com sucesso' });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PUT /api/v1/doadores/:id - ADMIN: atualizar perfil de doador
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Atualizar perfil de doador (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               tipoSangue: { type: 'string', example: 'O+' },
               idade: { type: 'number', example: 28 },
               peso: { type: 'number', example: 70 }
             }
           }
         }
       }
     }
  */
  const { idade, peso, tipoSangue } = req.body;

  try {
    const perfil = await repositorioPerfilDoador().findOne({
      where: { id: Number(req.params.id) },
      relations: ['usuario'],
    });

    if (!perfil) {
      res.status(404).json({ erro: 'Doador não encontrado' });
      return;
    }

    if (tipoSangue !== undefined) {
      if (!tipoSangue || !tipoSangue.trim()) {
        res.status(400).json({ erro: 'Tipo sanguíneo não pode ser vazio' });
        return;
      }
      perfil.tipoSangue = tipoSangue;
    }

    if (idade !== undefined) {
      if (idade < 18 || idade > 65) {
        res.status(400).json({ erro: 'Idade deve ser entre 18 e 65 anos' });
        return;
      }
      perfil.idade = idade;
    }

    if (peso !== undefined) {
      if (peso < 50) {
        res.status(400).json({ erro: 'Peso deve ser de pelo menos 50kg' });
        return;
      }
      perfil.peso = peso;
    }

    const perfilAtualizado = await repositorioPerfilDoador().save(perfil);
    res.json(perfilAtualizado);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// PATCH /api/v1/doadores/:id/status - ADMIN: atualizar status do utilizador (doador)
roteador.patch('/:id/status', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (req: Request, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Alternar status ativo/inativo do utilizador associado a um doador (ADMIN)'
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
    const perfil = await repositorioPerfilDoador().findOne({
      where: { id: Number(req.params.id) },
      relations: ['usuario'],
    });

    if (!perfil) {
      res.status(404).json({ erro: 'Doador não encontrado' });
      return;
    }

    if (req.body.ativo === undefined) {
      res.status(400).json({ erro: 'O campo ativo é obrigatório' });
      return;
    }

    // O status "ativo" pertence ao Utilizador
    const usuario = perfil.usuario;
    usuario.ativo = Boolean(req.body.ativo);
    
    await repositorioUsuario().save(usuario);
    
    res.json({ mensagem: 'Status do doador actualizado com sucesso', ativo: usuario.ativo });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// DELETE /api/v1/doadores/:id - ADMIN: remover perfil de doador
roteador.delete('/:id', async (req: Request, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Remover perfil de doador (ADMIN)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const perfil = await repositorioPerfilDoador().findOne({ where: { id: Number(req.params.id) } });
    
    if (!perfil) {
      res.status(404).json({ erro: 'Doador não encontrado' });
      return;
    }

    await repositorioPerfilDoador().softRemove(perfil);
    res.status(204).send();
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// POST /api/v1/doadores/perfil - criar/actualizar perfil do próprio doador
roteador.post('/perfil', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Doadores']
     #swagger.summary = 'Criar ou actualizar perfil do doador'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['tipoSangue'],
             properties: {
               tipoSangue: { type: 'string', example: 'O+', description: 'Tipo sanguíneo (ex: A+, B-, O+, AB-)' },
               idade: { type: 'number', example: 28, description: 'Idade entre 18 e 65 anos' },
               peso: { type: 'number', example: 70, description: 'Peso mínimo de 50kg' }
             }
           }
         }
       }
     }
  */
  const idUsuario = Number(req.usuario!.sub);

  const { idade, peso, tipoSangue, genero } = req.body;

  if (idade !== undefined && idade !== null && (idade < 18 || idade > 65)) {
    res.status(400).json({ erro: 'Idade deve ser entre 18 e 65 anos' });
    return;
  }

  if (peso !== undefined && peso !== null && peso < 50) {
    res.status(400).json({ erro: 'Peso deve ser de pelo menos 50kg' });
    return;
  }

  try {
    const usuario = await repositorioUsuario().findOne({ where: { id: idUsuario } });
    if (!usuario) {
      res.status(401).json({ erro: 'Não autorizado' });
      return;
    }

    let perfil = await repositorioPerfilDoador().findOne({ where: { usuario: { id: idUsuario } } });

    if (!perfil) {
      perfil = new PerfilDoador();
      perfil.usuario = usuario;
    }

    if (idade !== undefined) perfil.idade = idade;
    if (peso !== undefined) perfil.peso = peso;
    if (tipoSangue !== undefined && tipoSangue !== '') perfil.tipoSangue = tipoSangue;
    if (genero !== undefined && genero !== '') perfil.genero = genero;

    await repositorioPerfilDoador().save(perfil);

    res.json({ mensagem: 'Perfil de doador actualizado com sucesso', perfil });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

export default roteador;
