import bcrypt from "bcryptjs";
import { FonteDados } from "../configuracao/banco";
import { Usuario } from "../entidades/Usuario";
import { PerfilUsuario } from "../utilitarios/perfil-usuario.enum";
import { jwtServico } from "./jwt.servico";
import { v4 as uuid } from "uuid";

const repositorioUsuario = () => FonteDados.getRepository(Usuario);

export interface PedidoRegistro {
  nome?: string;
  email?: string;
  telefone?: string;
  senha: string;
  perfil?: PerfilUsuario;
}

export interface PedidoLogin {
  email: string;
  senha: string;
}

export interface PedidoLoginOAuth {
  email: string;
  nome?: string;
  provedor?: string;
}
export interface IUsuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}
export interface RespostaAutenticacao {
  token: string;
  usuario: IUsuario;
}

export class AutenticacaoServico {
  async registrar(
    dados: PedidoRegistro,
    criadoPorAdmin = false,
  ): Promise<RespostaAutenticacao> {
    if (
      (!dados.email || !dados.email.trim()) &&
      (!dados.telefone || !dados.telefone.trim())
    ) {
      throw new Error("Email ou telefone é obrigatório");
    }

    if (dados.email && dados.email.trim()) {
      const existente = await repositorioUsuario().findOne({
        where: { email: dados.email },
      });
      if (existente) throw new Error("Email já está em uso");
    }

    if (dados.telefone && dados.telefone.trim()) {
      const existente = await repositorioUsuario().findOne({
        where: { telefone: dados.telefone },
      });
      if (existente) throw new Error("Telefone já está em uso");
    }

    if (criadoPorAdmin && dados.perfil != null) {
      if (
        dados.perfil !== PerfilUsuario.DOADOR &&
        dados.perfil !== PerfilUsuario.ADMIN
      ) {
        throw new Error("Perfil inválido. Permitidos: DOADOR, ADMIN");
      }
    }

    if (!criadoPorAdmin && dados.perfil != null) {
      if (
        dados.perfil !== PerfilUsuario.DOADOR &&
        dados.perfil !== PerfilUsuario.RECEPTOR
      ) {
        throw new Error("Perfil inválido. Permitidos: DOADOR, RECEPTOR");
      }
    }

    const usuario = new Usuario();
    usuario.nome = dados.nome;
    usuario.email = dados.email;
    usuario.telefone = dados.telefone;
    usuario.senha = await bcrypt.hash(dados.senha, 10);
    usuario.perfil = dados.perfil != null ? dados.perfil : PerfilUsuario.DOADOR;
    usuario.ativo = true;

    const salvo = await repositorioUsuario().save(usuario);
    const token = jwtServico.gerarToken(salvo);
    return {
      token,
      usuario: {
        id: salvo.id,
        nome: salvo.nome,
        email: salvo.email,
        telefone: salvo.telefone,
        perfil: salvo.perfil,
        ativo: salvo.ativo,
      },
    };
  }

  async entrar(dados: PedidoLogin): Promise<RespostaAutenticacao> {
    if (!dados.email || !dados.senha) {
      throw new Error("Email e senha são obrigatórios");
    }

    const usuario =
      (await repositorioUsuario().findOne({
        where: { email: dados.email },
        relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro'],
      })) ||
      (await repositorioUsuario().findOne({
        where: { telefone: dados.email },
        relations: ['perfilHemocentro', 'perfilHemocentro.hemocentro'],
      }));

    if (!usuario || !(await bcrypt.compare(dados.senha, usuario.senha))) {
      throw new Error("Credenciais inválidas");
    }

    if (!usuario.ativo) {
      throw new Error("Conta desactivada");
    }

    const token = jwtServico.gerarToken(usuario);
    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
      },
    };
  }

  async entrarOAuth(dados: PedidoLoginOAuth): Promise<RespostaAutenticacao> {
    if (!dados.email || !dados.email.trim()) {
      throw new Error("Email é obrigatório para login OAuth");
    }

    let usuario = await repositorioUsuario().findOne({
      where: { email: dados.email },
    });

    if (!usuario) {
      usuario = new Usuario();
      usuario.email = dados.email;
      usuario.nome = dados.nome && dados.nome.trim() ? dados.nome : dados.email;
      usuario.senha = await bcrypt.hash(uuid(), 10);
      usuario.perfil = PerfilUsuario.DOADOR;
      usuario.ativo = true;
      usuario = await repositorioUsuario().save(usuario);
    }

    const token = jwtServico.gerarToken(usuario);
    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
      },
    };
  }
}

export const autenticacaoServico = new AutenticacaoServico();
