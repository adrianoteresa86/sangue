import { Request, Response, NextFunction } from 'express';
import { jwtServico, CargoJwt } from '../autenticacao/jwt.servico';

export interface RequisicaoAutenticada extends Request {
  usuario?: CargoJwt;
}

export function autenticacaoIntermediario(req: RequisicaoAutenticada, res: Response, proximo: NextFunction): void {
  const cabecalhoAuth = req.headers['authorization'];

  if (!cabecalhoAuth || !cabecalhoAuth.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token de autorização necessário' });
    return;
  }

  const token = cabecalhoAuth.substring(7);
  const cargo = jwtServico.validarToken(token);

  if (!cargo) {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
    return;
  }

  req.usuario = cargo;
  proximo();
}
