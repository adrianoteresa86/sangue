import { Request, Response, NextFunction } from 'express';

export function erroIntermediario(erro: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[Erro] ${req.method} ${req.path}`, erro);

  // Se o erro tiver um código de status HTTP definido, usamos; caso contrário, usamos 500
  const status = erro.status || 500;
  
  // Ocultamos erros 500 reais da base de dados do cliente
  const mensagem = status === 500 && process.env.NODE_ENV !== 'development' 
    ? 'Ocorreu um erro interno no servidor' 
    : erro.message;

  res.status(status).json({
    erro: mensagem,
    // Em modo de desenvolvimento, incluímos a stack para ajudar a debugar
    ...(process.env.NODE_ENV === 'development' && { detalhes: erro.message, stack: erro.stack }),
  });
}
