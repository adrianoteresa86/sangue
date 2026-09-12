import { Router, Request, Response } from "express";
import { autenticacaoServico } from "./autenticacao.servico";
import { jwtServico } from "./jwt.servico";
import { FonteDados } from "../configuracao/banco";
import { Usuario } from "../entidades/Usuario";
import { PerfilUsuario } from "../utilitarios/perfil-usuario.enum";
import { RequisicaoAutenticada, autenticacaoIntermediario } from "../intermediarios/autenticacao.intermediario";

const roteador = Router();

// POST /api/v1/auth/register
roteador.post("/registrar", async (req: Request, res: Response) => {
  /* #swagger.tags = ['Autenticação']
     #swagger.summary = 'Registar novo utilizador'
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['email', 'senha'],
             properties: {
               nome: { type: 'string', example: 'João Silva' },
               email: { type: 'string', example: 'joao@exemplo.com' },
               telefone: { type: 'string', example: '+258841234567' },
               senha: { type: 'string', example: 'senha123' },
               perfil: { type: 'string', enum: ['DOADOR', 'RECEPTOR'], example: 'DOADOR' }
             }
           }
         }
       }
     }
  */
  try {
    const resultado = await autenticacaoServico.registrar(req.body, false);
    res.json(resultado);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// POST /api/v1/auth/admin/register
roteador.post(
  "/admin/register",
  async (req: RequisicaoAutenticada, res: Response) => {
    /* #swagger.tags = ['Autenticação']
     #swagger.summary = 'Registar utilizador como admin (requer token de admin)'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['email', 'senha'],
             properties: {
               nome: { type: 'string', example: 'Admin Silva' },
               email: { type: 'string', example: 'admin@exemplo.com' },
               telefone: { type: 'string', example: '+258841234567' },
               senha: { type: 'string', example: 'senha123' },
               perfil: { type: 'string', enum: ['DOADOR', 'ADMIN', 'HEMOCENTRO', 'RECEPTOR'], example: 'ADMIN' }
             }
           }
         }
       }
     }
  */
    const cabecalhoAuth = req.headers["authorization"];
    if (!cabecalhoAuth || !cabecalhoAuth.startsWith("Bearer ")) {
      res.status(401).json({ erro: "Token de autorização necessário" });
      return;
    }

    const token = cabecalhoAuth.substring(7);
    const cargo = jwtServico.validarToken(token);

    if (!cargo) {
      res.status(401).json({ erro: "Token inválido ou expirado" });
      return;
    }

    if (cargo.perfil !== PerfilUsuario.ADMIN) {
      res.status(403).json({ erro: "Acesso de administrador necessário" });
      return;
    }

    const adminUsuario = await FonteDados.getRepository(Usuario).findOne({
      where: { id: Number(cargo.sub) },
    });
    if (!adminUsuario || !adminUsuario.ativo) {
      res.status(401).json({ erro: "Utilizador administrador inválido" });
      return;
    }

    try {
      const resultado = await autenticacaoServico.registrar(req.body, true);
      res.json(resultado);
    } catch (erro: any) {
      res.status(400).json({ erro: erro.message });
    }
  },
);

// POST /api/v1/auth/login
roteador.post("/login", async (req: Request, res: Response) => {
  /* #swagger.tags = ['Autenticação']
     #swagger.summary = 'Fazer login com email/telefone e senha'
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['identificador', 'senha'],
             properties: {
               identificador: { type: 'string', example: 'joao@exemplo.com', description: 'Email ou telefone' },
               senha: { type: 'string', example: 'senha123' }
             }
           }
         }
       }
     }
  */
  try {
    const resultado = await autenticacaoServico.entrar(req.body);
    res.json(resultado);
  } catch (erro: any) {
    const estado =
      erro.message === "Credenciais inválidas" ||
      erro.message === "Conta desactivada"
        ? 401
        : 400;
    res.status(estado).json({ erro: erro.message });
  }
});

// POST /api/v1/auth/oauth-login
roteador.post("/oauth-login", async (req: Request, res: Response) => {
  /* #swagger.tags = ['Autenticação']
     #swagger.summary = 'Login via OAuth (Google, etc.)'
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['email'],
             properties: {
               email: { type: 'string', example: 'joao@gmail.com' },
               nome: { type: 'string', example: 'João Silva' },
               provedor: { type: 'string', example: 'google' }
             }
           }
         }
       }
     }
  */
  try {
    const resultado = await autenticacaoServico.entrarOAuth(req.body);

    res.json(resultado);
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// GET /api/v1/auth/me
roteador.get("/me", autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Autenticação']
     #swagger.summary = 'Obter dados completos do utilizador autenticado'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);

    const usuario = await FonteDados.getRepository(Usuario).findOne({
      where: { id: idUsuario },
      relations: ["perfilDoador"],
    });

    if (!usuario) {
      res.status(404).json({ erro: "Utilizador não encontrado" });
      return;
    }

    const { senha: _, ...dadosUsuario } = usuario as any;

    res.json(dadosUsuario);
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/auth/validate
roteador.get("/validate", async (req: Request, res: Response) => {
  /* #swagger.tags = ['Autenticação']
     #swagger.summary = 'Validar token JWT'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  const cabecalhoAuth = req.headers["authorization"];

  if (!cabecalhoAuth || !cabecalhoAuth.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Token de autorização necessário" });
    return;
  }

  const token = cabecalhoAuth.substring(7);

  try {
    const cargo = jwtServico.analisarToken(token);
    const idUsuario = Number(cargo.sub);

    const usuario = await FonteDados.getRepository(Usuario).findOne({
      where: { id: idUsuario },
      relations: ["perfilDoador"],
    });

    let tipoSangue: string | null = null;
    if (usuario?.perfilDoador?.tipoSangue) {
      tipoSangue = usuario.perfilDoador.tipoSangue;
    }

    res.json({
      valido: true,
      idUsuario,
      email: cargo.email,
      perfil: cargo.perfil,
      tipoSangue,
    });
  } catch (erro: any) {
    if (erro.name === "TokenExpiredError") {
      res.status(401).json({ erro: "Token expirado" });
    } else {
      res.status(401).json({ erro: "Token inválido" });
    }
  }
});

export default roteador;
