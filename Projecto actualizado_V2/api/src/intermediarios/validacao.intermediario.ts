import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validacaoIntermediario(tipoDto: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const dtoObjeto = plainToInstance(tipoDto, req.body);
    
    validate(dtoObjeto).then((erros: ValidationError[]) => {
      if (erros.length > 0) {
        // Extrair mensagens de erro
        const mensagensErro = erros.map((erro: ValidationError) => {
          return Object.values(erro.constraints || {}).join(', ');
        });
        
        // Retornar Bad Request (400) e parar o pipeline
        res.status(400).json({ 
          erro: 'Falha na validação de dados', 
          detalhes: mensagensErro 
        });
        return; // Certificar-se que a função termina aqui
      } else {
        // Se a validação passou, substitui o req.body com a instância validada
        req.body = dtoObjeto;
        next();
      }
    });
  };
}
