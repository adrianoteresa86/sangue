import { Request, Response, NextFunction } from 'express';
import { FonteDados } from '../configuracao/banco';
import { Auditoria } from '../entidades/Auditoria';

export const auditoriaIntermediario = (req: Request, res: Response, next: NextFunction) => {
  // Executamos o próximo middleware/rota imediatamente
  next();

  // Ações de alteração de estado (não interceptar GET, OPTIONS, etc)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', async () => {
      try {
        const repo = FonteDados.getRepository(Auditoria);
        
        // Clona body removendo dados sensíveis (ex: senhas)
        const detalhes = { ...req.body };
        if (detalhes.senha) delete detalhes.senha;
        if (detalhes.senha_atual) delete detalhes.senha_atual;

        const auditoria = repo.create({
          acao: req.method,
          entidade: req.originalUrl,
          detalhes: Object.keys(detalhes).length > 0 ? detalhes : null,
          usuario_id: (req as any).usuario?.id || null
        });

        await repo.save(auditoria);
      } catch (error) {
        console.error('Erro ao registar auditoria:', error);
      }
    });
  }
};
