import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Usuario } from '../entidades/Usuario';

dotenv.config();

const CHAVE_JWT = process.env.JWT_SECRET || 'MinhaChaveSuperSecretaQueDeveSerLongaEVigorosa123!';
const EXPIRACAO_JWT = Number(process.env.JWT_EXPIRATION) || 86400000;

export interface CargoJwt {
  sub: string;
  email: string;
  perfil: string;
  hemocentroId?: number;
  iat?: number;
  exp?: number;
}

export class JwtServico {
  gerarToken(usuario: Usuario): string {
    const cargo: CargoJwt = {
      sub: String(usuario.id),
      email: usuario.email,
      perfil: usuario.perfil,
      hemocentroId: usuario.perfilHemocentro?.hemocentro?.id,
    };
    return jwt.sign(cargo, CHAVE_JWT, { expiresIn: Math.floor(EXPIRACAO_JWT / 1000) });
  }

  analisarToken(token: string): CargoJwt {
    return jwt.verify(token, CHAVE_JWT) as CargoJwt;
  }

  validarToken(token: string): CargoJwt | null {
    try {
      return this.analisarToken(token);
    } catch {
      return null;
    }
  }
}

export const jwtServico = new JwtServico();
