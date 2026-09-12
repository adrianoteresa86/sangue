import {
  Entity,
  PrimaryGeneratedColumn, DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { Hemocentro } from './Hemocentro';

export enum StatusEstoque {
  ADEQUADO = 'Adequado',
  BAIXO = 'Baixo',
  CRITICO = 'Crítico'
}

@Entity('estoque_sangue')
export class EstoqueSangue {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hemocentro, { nullable: false })
  @JoinColumn({ name: 'hemocenter_id' })
  hemocentro: Hemocentro;

  @Column({ name: 'blood_type', nullable: false, length: 5 })
  tipoSangue: string;

  @Column({ name: 'quantity', nullable: false })
  quantidade: number;

  @Column({ name: 'component_type', nullable: false })
  tipoComponente: string;

  @Column({ name: 'expiration_date', nullable: false })
  dataValidade: Date;

  @Column({ name: 'received_date', nullable: false })
  dataRecebimento: Date;

  @Column({ name: 'available', default: true })
  disponivel: boolean;

  @Column({
    name: 'status',
    type: 'enum',
    enum: StatusEstoque,
    default: StatusEstoque.ADEQUADO
  })
  status: StatusEstoque;

  @Column({ name: 'created_at', nullable: false })
  criadoEm: Date;

  @Column({ name: 'updated_at', nullable: true })
  atualizadoEm: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  apagadoEm: Date;

  @BeforeInsert()
  aoInserir() {
    this.criadoEm = new Date();
    this.atualizadoEm = new Date();
    if (!this.dataRecebimento) this.dataRecebimento = new Date();
    this.calcularStatus();
  }

  @BeforeUpdate()
  aoAtualizar() {
    this.atualizadoEm = new Date();
    this.calcularStatus();
  }

  @AfterLoad()
  private calcularStatus() {
    // Lógica para determinar o status baseado na quantidade e validade
    const LIMITE_CRITICO = 200; // mL
    const LIMITE_BAIXO = 500; // mL
    
    // Garantir que dataValidade seja um objeto Date
    const dataValidade = this.dataValidade instanceof Date ? this.dataValidade : new Date(this.dataValidade);
    
    // Calcular dias para vencer
    const agora = new Date();
    const diasParaVencer = Math.ceil(
      (dataValidade.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Determinar dias de alerta por componente
    let diasParaAlerta = 7; // padrão
    switch (this.tipoComponente.toLowerCase()) {
      case 'plaquetas':
      case 'plaq.':
        diasParaAlerta = 5; // Plaquetas vencem em 5-7 dias
        break;
      case 'plasma':
      case 'plasma fresco':
      case 'plasma congelado':
        diasParaAlerta = 30; // Plasma dura 1 ano, mas alerta com 30 dias
        break;
      case 'sangue total':
      case 'concentrado de hemácias':
      case 'hemácias':
        diasParaAlerta = 7; // Alerta antecipado para hemácias
        break;
    }
    
    // Calcular status por quantidade
    let statusPorQuantidade: StatusEstoque;
    if (this.quantidade <= LIMITE_CRITICO) {
      statusPorQuantidade = StatusEstoque.CRITICO;
    } else if (this.quantidade <= LIMITE_BAIXO) {
      statusPorQuantidade = StatusEstoque.BAIXO;
    } else {
      statusPorQuantidade = StatusEstoque.ADEQUADO;
    }
    
    // Calcular status por validade
    let statusPorValidade: StatusEstoque;
    if (diasParaVencer <= 0) {
      statusPorValidade = StatusEstoque.CRITICO; // Já venceu
    } else if (diasParaVencer <= diasParaAlerta) {
      statusPorValidade = StatusEstoque.BAIXO; // Vencendo em breve
    } else {
      statusPorValidade = StatusEstoque.ADEQUADO; // Validade ok
    }
    
    // Usar o pior status entre quantidade e validade
    if (statusPorQuantidade === StatusEstoque.CRITICO || statusPorValidade === StatusEstoque.CRITICO) {
      this.status = StatusEstoque.CRITICO;
    } else if (statusPorQuantidade === StatusEstoque.BAIXO || statusPorValidade === StatusEstoque.BAIXO) {
      this.status = StatusEstoque.BAIXO;
    } else {
      this.status = StatusEstoque.ADEQUADO;
    }
  }
}
