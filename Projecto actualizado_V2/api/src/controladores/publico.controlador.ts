import { Router, Request, Response } from 'express';
import { FonteDados } from '../configuracao/banco';
import { EstoqueSangue } from '../entidades/EstoqueSangue';

const roteador = Router();

// Limiares de status por quantidade total (mL) por tipo sanguíneo
const LIMIAR_CRITICO = 900;   // < 2 bolsas de 450 mL
const LIMIAR_BAIXO   = 2250;  // < 5 bolsas
const LIMIAR_NORMAL  = 4500;  // < 10 bolsas

function calcularStatus(totalMl: number): 'critical' | 'low' | 'normal' | 'high' {
  if (totalMl < LIMIAR_CRITICO) return 'critical';
  if (totalMl < LIMIAR_BAIXO)   return 'low';
  if (totalMl < LIMIAR_NORMAL)  return 'normal';
  return 'high';
}

// GET /api/v1/publico/estoque-resumo  — sem autenticação
roteador.get('/estoque-resumo', async (_req: Request, res: Response) => {
  try {
    const agora = new Date();

    // Agregar quantidade disponível por tipo sanguíneo
    const rows = await FonteDados.getRepository(EstoqueSangue)
      .createQueryBuilder('e')
      .select('e.tipoSangue', 'tipoSangue')
      .addSelect('SUM(e.quantidade)', 'totalQuantidade')
      .addSelect('COUNT(e.id)', 'numLotes')
      .where('e.disponivel = true')
      .andWhere('e.dataValidade > :agora', { agora })
      .groupBy('e.tipoSangue')
      .getRawMany<{ tipoSangue: string; totalQuantidade: string; numLotes: string }>();

    // Construir mapa por tipo sanguíneo
    const mapa: Record<string, { totalMl: number; numLotes: number }> = {};
    for (const r of rows) {
      mapa[r.tipoSangue] = {
        totalMl:  Number(r.totalQuantidade),
        numLotes: Number(r.numLotes),
      };
    }

    // Garantir todos os 8 tipos (para mostrar 0 nos que não têm estoque)
    const TODOS_TIPOS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const inventario = TODOS_TIPOS.map((tipo) => {
      const dados   = mapa[tipo] ?? { totalMl: 0, numLotes: 0 };
      const bolsas  = Math.floor(dados.totalMl / 450); // 1 bolsa ≈ 450 mL
      const status  = calcularStatus(dados.totalMl);
      return {
        tipoSangue:      tipo,
        totalMl:         dados.totalMl,
        bolsas,
        numLotes:        dados.numLotes,
        status,
        minRecomendado:  5,   // bolsas
        maxRecomendado:  20,  // bolsas
      };
    });

    const totalMlGeral   = inventario.reduce((s, i) => s + i.totalMl, 0);
    const totalBolsas    = inventario.reduce((s, i) => s + i.bolsas, 0);
    const totalCriticos  = inventario.filter((i) => i.status === 'critical').length;
    const totalBaixos    = inventario.filter((i) => i.status === 'low').length;

    res.json({
      resumo: {
        totalMl:      totalMlGeral,
        totalBolsas,
        criticos:     totalCriticos,
        baixos:       totalBaixos,
        atualizadoEm: agora.toISOString(),
      },
      inventario,
    });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

export default roteador;
