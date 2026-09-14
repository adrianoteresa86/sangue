import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';
import { PerfilHemocentro } from '../entidades/PerfilHemocentro';
import { Hemocentro } from '../entidades/Hemocentro';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { autenticacaoIntermediario, RequisicaoAutenticada } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { validacaoIntermediario } from '../intermediarios/validacao.intermediario';
import { CriarUsuarioDto, ActualizarUsuarioDto } from '../dto/usuario.dto';
import { comunicacaoServico } from '../servicos/comunicacao.servico';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';

const roteador = Router();

const repositorioUsuario = () => FonteDados.getRepository(Usuario);
const repositorioPerfilHemocentro = () => FonteDados.getRepository(PerfilHemocentro);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);

const paraUsuarioSeguro = (u: Usuario) => ({
  id: u.id,
  nome: u.nome ?? '',
  email: u.email ?? '',
  telefone: u.telefone ?? '',
  perfil: u.perfil ?? 'DOADOR',
  ativo: u.ativo,
  criadoEm: u.criadoEm ?? null,
  perfilHemocentro: u.perfilHemocentro && u.perfilHemocentro.hemocentro ? { 
    hemocentroId: u.perfilHemocentro.hemocentro.id,
    hemocentroNome: u.perfilHemocentro.hemocentro.nome
  } : undefined,
});

// GET /api/v1/usuarios - ADMIN e COORDENADOR_HEMOCENTRO
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO), async (req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Listar todos os utilizadores'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      where.perfilHemocentro = { hemocentro: { id: usuarioLogado.hemocentroId } };
    } else if (req.query.hemocentroId) {
      where.perfilHemocentro = { hemocentro: { id: Number(req.query.hemocentroId) } };
    }

    let [utilizadores, total] = await repositorioUsuario().findAndCount({
      where,
      relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro'],
      skip,
      take: limit,
      order: { criadoEm: 'DESC' }
    });

    res.json({
      usuarios: utilizadores.map(paraUsuarioSeguro),
      paginacao: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (erro: any) {
    next(erro);
  }
});

// GET /api/v1/usuarios/admins - ADMIN
roteador.get('/admins', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Listar utilizadores com perfil ADMIN'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const admins = await repositorioUsuario().find({ where: { perfil: PerfilUsuario.ADMIN } });
    res.json({ usuarios: admins.map(paraUsuarioSeguro) });
  } catch (erro: any) {
    next(erro);
  }
});

// GET /api/v1/usuarios/doadores - ADMIN
roteador.get('/doadores', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Listar utilizadores com perfil DOADOR'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const doadores = await repositorioUsuario().find({ where: { perfil: PerfilUsuario.DOADOR } });
    res.json({ usuarios: doadores.map(paraUsuarioSeguro) });
  } catch (erro: any) {
    next(erro);
  }
});

// GET /api/v1/usuarios/receptores - ADMIN
roteador.get('/receptores', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN), async (_req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Listar utilizadores com perfil RECEPTOR'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const receptores = await repositorioUsuario().find({ where: { perfil: PerfilUsuario.RECEPTOR } });
    res.json({ usuarios: receptores.map(paraUsuarioSeguro) });
  } catch (erro: any) {
    next(erro);
  }
});

// GET /api/v1/usuarios/:id - ADMIN e COORDENADOR_HEMOCENTRO
roteador.get('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO), async (req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Obter utilizador por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const usuario = await repositorioUsuario().findOne({ 
      where: { id: Number(req.params.id) },
      relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro']
    });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }
    
    if (usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      if (usuario.perfilHemocentro?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        res.status(403).json({ erro: 'Não tem permissão para aceder a este utilizador' });
        return;
      }
    }

    res.json({ usuario: paraUsuarioSeguro(usuario) });
  } catch (erro: any) {
    next(erro);
  }
});

// POST /api/v1/usuarios/adicionar - ADMIN e COORDENADOR_HEMOCENTRO
roteador.post('/adicionar', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO), validacaoIntermediario(CriarUsuarioDto), async (req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Criar novo utilizador (ADMIN ou COORDENADOR)'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  let { nome, email, telefone, senha, perfil, ativo, hemocentroId } = req.body;
  const usuarioLogado = (req as any).usuario;

  try {
    if (usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      if (perfil !== PerfilUsuario.TECNICO_HEMOCENTRO && perfil !== PerfilUsuario.COORDENADOR_HEMOCENTRO) {
        res.status(403).json({ erro: 'Um Coordenador apenas pode criar Técnicos ou Coordenadores' });
        return;
      }
      hemocentroId = usuarioLogado.hemocentroId;
    }

    const existente = await repositorioUsuario().findOne({ where: { email } });
    if (existente) {
      res.status(400).json({ erro: 'Email já está em uso' });
      return;
    }

    const novoUsuario = new Usuario();
    novoUsuario.nome = nome;
    novoUsuario.email = email;
    novoUsuario.telefone = telefone;
    novoUsuario.ativo = ativo !== undefined ? ativo : true;
    novoUsuario.perfil = perfil || PerfilUsuario.DOADOR;
    novoUsuario.senha = await bcrypt.hash(senha, 10);

    const usuarioSalvo = await repositorioUsuario().save(novoUsuario);

    if ((perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || perfil === PerfilUsuario.TECNICO_HEMOCENTRO) && hemocentroId) {
      const hemocentro = await repositorioHemocentro().findOne({ where: { id: Number(hemocentroId) } });
      if (hemocentro) {
        const perfilHemo = new PerfilHemocentro();
        perfilHemo.usuario = usuarioSalvo;
        perfilHemo.hemocentro = hemocentro;
        await repositorioPerfilHemocentro().save(perfilHemo);
        usuarioSalvo.perfilHemocentro = perfilHemo;
      }
    }

    if (usuarioSalvo.email) {
      comunicacaoServico.notificarUsuario(
        usuarioSalvo,
        'Bem-vindo ao Sistema Sangue!',
        `A sua conta foi criada com sucesso com o perfil de ${usuarioSalvo.perfil}. \n Utilize o seu email e a senha que foi configurada pelo administrador para aceder ao sistema.`,
        TipoNotificacao.BOAS_VINDAS,
        true, // enviarEmail
        false // enviarSms
      ).catch(() => {});
    }

    res.json({ mensagem: 'Utilizador criado com sucesso', usuario: paraUsuarioSeguro(usuarioSalvo) });
  } catch (erro: any) {
    next(erro);
  }
});

// PUT /api/v1/usuarios/:id - ADMIN e COORDENADOR_HEMOCENTRO
roteador.put('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO), validacaoIntermediario(ActualizarUsuarioDto), async (req, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Actualizar utilizador'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  let { nome, email, telefone, senha, perfil, ativo, hemocentroId } = req.body;
  const usuarioLogado = (req as any).usuario;

  try {
    const usuario = await repositorioUsuario().findOne({ 
      where: { id: Number(req.params.id) },
      relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro']
    });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    if (usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      if (usuario.perfilHemocentro?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        res.status(403).json({ erro: 'Não tem permissão para editar este utilizador' });
        return;
      }
      if (perfil && perfil !== PerfilUsuario.TECNICO_HEMOCENTRO && perfil !== PerfilUsuario.COORDENADOR_HEMOCENTRO) {
        res.status(403).json({ erro: 'Não tem permissão para alterar o utilizador para este perfil' });
        return;
      }
      hemocentroId = usuarioLogado.hemocentroId; // force to be the same
    }

    if (email && email !== usuario.email) {
      const existente = await repositorioUsuario().findOne({ where: { email } });
      if (existente) {
        res.status(400).json({ erro: 'Email já está em uso' });
        return;
      }
    }

    if (nome) usuario.nome = nome;
    if (email) usuario.email = email;
    if (telefone) usuario.telefone = telefone;
    if (perfil) usuario.perfil = perfil;
    if (ativo !== undefined) usuario.ativo = ativo;
    if (senha) usuario.senha = await bcrypt.hash(senha, 10);

    await repositorioUsuario().save(usuario);

    if ((perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || perfil === PerfilUsuario.TECNICO_HEMOCENTRO) && hemocentroId) {
      const hemocentro = await repositorioHemocentro().findOne({ where: { id: Number(hemocentroId) } });
      if (hemocentro) {
        let perfilHemo = usuario.perfilHemocentro;
        if (!perfilHemo) {
          perfilHemo = new PerfilHemocentro();
          perfilHemo.usuario = usuario;
        }
        perfilHemo.hemocentro = hemocentro;
        await repositorioPerfilHemocentro().save(perfilHemo);
        usuario.perfilHemocentro = perfilHemo;
      }
    } else if ((perfil !== PerfilUsuario.COORDENADOR_HEMOCENTRO && perfil !== PerfilUsuario.TECNICO_HEMOCENTRO) && usuario.perfilHemocentro) {
      await repositorioPerfilHemocentro().softRemove(usuario.perfilHemocentro);
      usuario.perfilHemocentro = null as any;
    }

    res.json({ mensagem: 'Utilizador actualizado com sucesso', usuario: paraUsuarioSeguro(usuario) });
  } catch (erro: any) {
    next(erro);
  }
});

// PUT /api/v1/usuarios/meu-perfil - DOADOR/RECEPTOR: actualizar próprio perfil
roteador.put('/meu-perfil', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Actualizar próprio perfil (DOADOR/RECEPTOR)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             properties: {
               nome: { type: 'string', example: 'João Silva' },
               email: { type: 'string', example: 'joao@exemplo.com' },
               telefone: { type: 'string', example: '+258841234567' },
               rua: { type: 'string', example: 'Rua Comandante Gika' },
               numero: { type: 'string', example: '567' },
               bairro: { type: 'string', example: 'Alvalade' },
               provincia: { type: 'string', example: 'Luanda' }
             }
           }
         }
       }
     }
  */
  const idUsuario = Number(req.usuario!.sub);

  const { nome, email, telefone, rua, numero, bairro, provincia } = req.body;

  try {
    const usuario = await repositorioUsuario().findOne({ where: { id: idUsuario } });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    // Verificar se está tentando atualizar o próprio usuário
    if (Number(req.usuario!.sub) !== usuario.id) {
      res.status(403).json({ erro: 'Proibido: só pode actualizar o próprio perfil' });
      return;
    }

    // Actualizar apenas campos permitidos
    if (nome && nome.trim()) usuario.nome = nome;
    if (email && email.trim()) usuario.email = email;
    if (telefone && telefone.trim()) usuario.telefone = telefone;
    if (rua && rua.trim()) usuario.rua = rua;
    if (numero && numero.trim()) usuario.numero = numero;
    if (bairro && bairro.trim()) usuario.bairro = bairro;
    if (provincia && provincia.trim()) usuario.provincia = provincia;

    await repositorioUsuario().save(usuario);
    
    // Retornar dados actualizados (sem senha)
    const usuarioActualizado = paraUsuarioSeguro(usuario);
    res.json({ 
      mensagem: 'Perfil actualizado com sucesso', 
      usuario: usuarioActualizado 
    });
  } catch (erro: any) {
    next(erro);
  }
});

// PATCH /api/v1/usuarios/:id/status - ADMIN e COORDENADOR_HEMOCENTRO
roteador.patch('/:id/status', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO), async (req: Request, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Alternar status ativo/inativo de um utilizador'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const usuario = await repositorioUsuario().findOne({ 
      where: { id: Number(req.params.id) },
      relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro']
    });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    if (usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      if (usuario.perfilHemocentro?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        res.status(403).json({ erro: 'Não tem permissão para aceder a este utilizador' });
        return;
      }
    }

    if (req.body.ativo === undefined) {
      res.status(400).json({ erro: 'O campo ativo é obrigatório' });
      return;
    }

    usuario.ativo = Boolean(req.body.ativo);
    await repositorioUsuario().save(usuario);

    res.json({ mensagem: 'Status actualizado com sucesso', usuario: paraUsuarioSeguro(usuario) });
  } catch (erro: any) {
    next(erro);
  }
});

// DELETE /api/v1/usuarios/:id - ADMIN e COORDENADOR_HEMOCENTRO
roteador.delete('/:id', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO), async (req: RequisicaoAutenticada, res: Response, next: NextFunction) => {
  /* #swagger.tags = ['Utilizadores']
     #swagger.summary = 'Eliminar utilizador'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const usuario = await repositorioUsuario().findOne({ 
      where: { id: Number(req.params.id) },
      relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro']
    });
    if (!usuario) {
      res.status(404).json({ erro: 'Utilizador não encontrado' });
      return;
    }

    if (Number(req.usuario!.sub) === usuario.id) {
      res.status(400).json({ erro: 'Não pode eliminar a sua própria conta' });
      return;
    }

    if (usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      if (usuario.perfilHemocentro?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        res.status(403).json({ erro: 'Não tem permissão para eliminar este utilizador' });
        return;
      }
    }

    if (usuario.perfilHemocentro) {
      await repositorioPerfilHemocentro().remove(usuario.perfilHemocentro);
    }
    await repositorioUsuario().softRemove(usuario);
    res.json({ mensagem: 'Utilizador eliminado com sucesso' });
  } catch (erro: any) {
    next(erro);
  }
});

export default roteador;
