import { Response, NextFunction } from 'express';
import { RequisicaoAutenticada } from './autenticacao.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

export function exigirPerfil(...perfis: PerfilUsuario[]) {
  return (req: RequisicaoAutenticada, res: Response, proximo: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ erro: 'Não autorizado' });
      return;
    }

    if (!perfis.includes(req.usuario.perfil as PerfilUsuario)) {
      res.status(403).json({ erro: 'Proibido: permissões insuficientes' });
      return;
    }

    proximo();
  };
}
