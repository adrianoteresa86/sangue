import { FonteDados } from '../configuracao/banco';
import { EstoqueSangue, StatusEstoque } from '../entidades/EstoqueSangue';
import { Hemocentro } from '../entidades/Hemocentro';
import { RegistroTransfusao } from '../entidades/RegistroTransfusao';
import { FormatarData } from '../utilitarios/formatar-data';

const repositorioEstoque = () => FonteDados.getRepository(EstoqueSangue);
const repositorioHemocentro = () => FonteDados.getRepository(Hemocentro);
const repositorioRegistroTransfusao = () => FonteDados.getRepository(RegistroTransfusao);

export class EstoqueSangueServico {
  private calcularStatusPorQuantidade(quantidade: number): StatusEstoque {
    const LIMITE_CRITICO = 200; // mL
    const LIMITE_BAIXO = 500; // mL

    if (quantidade <= LIMITE_CRITICO) {
      return StatusEstoque.CRITICO;
    } else if (quantidade <= LIMITE_BAIXO) {
      return StatusEstoque.BAIXO;
    } else {
      return StatusEstoque.ADEQUADO;
    }
  }

  private getDiasParaAlerta(componente: string): number {
    // Dias de alerta baseados em recomendações médicas
    switch (componente.toLowerCase()) {
      case 'plaquetas':
      case 'plaq.':
        return 5; // Plaquetas vencem em 5-7 dias
      case 'plasma':
      case 'plasma fresco':
      case 'plasma congelado':
        return 30; // Plasma dura 1 ano, mas alerta com 30 dias
      case 'sangue total':
      case 'concentrado de hemácias':
      case 'hemácias':
        return 7; // Alerta antecipado para hemácias
      default:
        return 7; // Padrão de 7 dias para componentes não especificados
    }
  }

  private calcularStatusPorValidade(componente: string, dataValidade: Date): StatusEstoque {
    const agora = new Date();
    
    // Garantir que dataValidade seja um objeto Date
    const dataValid = dataValidade instanceof Date ? dataValidade : new Date(dataValidade);
    
    const diasParaVencer = Math.ceil(
      (dataValid.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const diasParaAlerta = this.getDiasParaAlerta(componente);
    
    // Se está vencendo ou já venceu, torna-se crítico
    if (diasParaVencer <= 0) {
      return StatusEstoque.CRITICO;
    }
    
    // Se está no período de alerta, torna-se baixo
    if (diasParaVencer <= diasParaAlerta) {
      return StatusEstoque.BAIXO;
    }
    
    // Se não, mantém adequado
    return StatusEstoque.ADEQUADO;
  }

  async criar(dados: {
    idHemocentro: number;
    tipoSangue: string;
    quantidade: number;
    tipoComponente: string;
    dataValidade: Date;
    dataRecebimento?: Date;
  }): Promise<EstoqueSangue> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');

    const estoque = repositorioEstoque().create({
      hemocentro,
      tipoSangue: dados.tipoSangue,
      quantidade: dados.quantidade,
      tipoComponente: dados.tipoComponente,
      dataValidade: dados.dataValidade,
      dataRecebimento: dados.dataRecebimento || new Date(),
    });

    return repositorioEstoque().save(estoque);
  }

  async atualizar(id: number, dados: Partial<{
    idHemocentro: number;
    tipoSangue: string;
    quantidade: number;
    tipoComponente: string;
    dataValidade: Date;
  }>): Promise<EstoqueSangue> {
    const estoque = await repositorioEstoque().findOne({ where: { id }, relations: ['hemocentro'] });
    if (!estoque) throw new Error('Estoque não encontrado');

    if (dados.idHemocentro && dados.idHemocentro !== estoque.hemocentro.id) {
      const hemocentro = await repositorioHemocentro().findOne({ where: { id: dados.idHemocentro } });
      if (!hemocentro) throw new Error('Hemocentro não encontrado');
      estoque.hemocentro = hemocentro;
    }

    if (dados.tipoSangue != null) estoque.tipoSangue = dados.tipoSangue;
    if (dados.quantidade != null) estoque.quantidade = dados.quantidade;
    if (dados.tipoComponente != null) estoque.tipoComponente = dados.tipoComponente;
    if (dados.dataValidade != null) estoque.dataValidade = dados.dataValidade;

    return repositorioEstoque().save(estoque);
  }

  async remover(id: number): Promise<void> {
    const estoque = await repositorioEstoque().findOne({ where: { id } });
    if (!estoque) throw new Error('Estoque não encontrado');

    const registros = await repositorioRegistroTransfusao().find({ where: { estoqueSangue: { id } } });
    if (registros.length > 0) {
      throw new Error(`Não é possível remover este item pois existem ${registros.length} registros de transfusão associados`);
    }

    await repositorioEstoque().remove(estoque);
  }

  async buscarPorId(id: number): Promise<EstoqueSangue> {
    const estoque = await repositorioEstoque().findOne({ where: { id }, relations: ['hemocentro'] });
    if (!estoque) throw new Error('Estoque não encontrado');
    return estoque;
  }

  async listarTodos(): Promise<EstoqueSangue[]> {
    const estoques = await repositorioEstoque().find({ relations: ['hemocentro'] });
    
    // Garantir que o status esteja sempre calculado corretamente
    return estoques.map(estoque => {
      if (!estoque.status) {
        // Combinar status por quantidade e validade (usar o pior status)
        const statusPorQuantidade = this.calcularStatusPorQuantidade(estoque.quantidade);
        const statusPorValidade = this.calcularStatusPorValidade(estoque.tipoComponente, estoque.dataValidade);
        
        // Se qualquer um for crítico, status é crítico
        if (statusPorQuantidade === StatusEstoque.CRITICO || statusPorValidade === StatusEstoque.CRITICO) {
          estoque.status = StatusEstoque.CRITICO;
        }
        // Se qualquer um for baixo, status é baixo
        else if (statusPorQuantidade === StatusEstoque.BAIXO || statusPorValidade === StatusEstoque.BAIXO) {
          estoque.status = StatusEstoque.BAIXO;
        }
        // Senão, é adequado
        else {
          estoque.status = StatusEstoque.ADEQUADO;
        }
      }
      
      // Adicionar propriedades formatadas (sem persistir no banco)
      (estoque as any).dataValidadeFormatada = FormatarData.formatarData(estoque.dataValidade);
      (estoque as any).diasParaVencer = FormatarData.calcularDiasParaVencer(estoque.dataValidade);
      (estoque as any).statusValidade = FormatarData.formatarDiasParaVencer(estoque.dataValidade);
      
      return estoque;
    });
  }

  async listarTodosFormatados(): Promise<any[]> {
    const estoques = await this.listarTodos();
    
    return estoques.map(estoque => ({
      id: estoque.id,
      tipoSangue: estoque.tipoSangue,
      quantidade: estoque.quantidade,
      tipoComponente: estoque.tipoComponente,
      dataValidade: FormatarData.formatarData(estoque.dataValidade),
      dataValidadeOriginal: estoque.dataValidade,
      dataRecebimento: FormatarData.formatarData(estoque.dataRecebimento),
      dataRecebimentoOriginal: estoque.dataRecebimento,
      diasParaVencer: FormatarData.calcularDiasParaVencer(estoque.dataValidade),
      statusValidade: FormatarData.formatarDiasParaVencer(estoque.dataValidade),
      status: estoque.status,
      hemocentro: estoque.hemocentro ? {
        id: estoque.hemocentro.id,
        nome: estoque.hemocentro.nome
      } : null,
      disponivel: estoque.disponivel,
      criadoEm: FormatarData.formatarData(estoque.criadoEm),
      atualizadoEm: estoque.atualizadoEm ? FormatarData.formatarData(estoque.atualizadoEm) : null
    }));
  }

  async buscarPorHemocentro(idHemocentro: number): Promise<EstoqueSangue[]> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id: idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');
    return repositorioEstoque().find({ where: { hemocentro: { id: idHemocentro } }, relations: ['hemocentro'] });
  }

  async buscarDisponiveisPorHemocentro(idHemocentro: number): Promise<EstoqueSangue[]> {
    const hemocentro = await repositorioHemocentro().findOne({ where: { id: idHemocentro } });
    if (!hemocentro) throw new Error('Hemocentro não encontrado');

    return repositorioEstoque()
      .createQueryBuilder('est')
      .leftJoinAndSelect('est.hemocentro', 'h')
      .where('est.hemocenter_id = :idHemocentro', { idHemocentro })
      .andWhere('est.disponivel = true')
      .andWhere('est.dataValidade > :agora', { agora: new Date() })
      .orderBy('est.dataValidade', 'ASC')
      .getMany();
  }

  async buscarVencendoEmBreve(): Promise<EstoqueSangue[]> {
    const agora = new Date();
    
    return repositorioEstoque()
      .createQueryBuilder('est')
      .leftJoinAndSelect('est.hemocentro', 'h')
      .where('est.disponivel = true')
      .andWhere(
        `CASE 
          WHEN LOWER(est.tipoComponente) LIKE '%plaquet%' OR LOWER(est.tipoComponente) LIKE '%plaq.%' THEN est.dataValidade <= :limitePlaquetas
          WHEN LOWER(est.tipoComponente) LIKE '%plasma%' THEN est.dataValidade <= :limitePlasma
          WHEN LOWER(est.tipoComponente) LIKE '%sangue%' OR LOWER(est.tipoComponente) LIKE '%hemác%' THEN est.dataValidade <= :limiteSangue
          ELSE est.dataValidade <= :limitePadrao
        END`,
        { 
          limitePlaquetas: new Date(agora.getTime() + (5 * 24 * 60 * 60 * 1000)),   // 5 dias para plaquetas
          limitePlasma: new Date(agora.getTime() + (30 * 24 * 60 * 60 * 1000)),   // 30 dias para plasma
          limiteSangue: new Date(agora.getTime() + (7 * 24 * 60 * 60 * 1000)),     // 7 dias para sangue/hemácias
          limitePadrao: new Date(agora.getTime() + (7 * 24 * 60 * 60 * 1000))     // 7 dias padrão
        }
      )
      .orderBy('est.dataValidade', 'ASC')
      .getMany();
  }

  async marcarComoIndisponivel(id: number): Promise<void> {
    const estoque = await repositorioEstoque().findOne({ where: { id } });
    if (!estoque) throw new Error('Estoque não encontrado');
    estoque.disponivel = false;
    await repositorioEstoque().save(estoque);
  }

  async diminuirQuantidade(id: number, quantidade: number): Promise<void> {
    const estoque = await repositorioEstoque().findOne({ where: { id } });
    if (!estoque) throw new Error('Estoque não encontrado');

    if (estoque.quantidade < quantidade) {
      throw new Error(`Quantidade insuficiente no estoque. Disponível: ${estoque.quantidade}, Solicitado: ${quantidade}`);
    }

    estoque.quantidade -= quantidade;
    await repositorioEstoque().save(estoque);
  }
}

export const estoqueSangueServico = new EstoqueSangueServico();
