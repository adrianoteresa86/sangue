import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { PedidoTransfusao } from './PedidoTransfusao';
import { Hemocentro } from './Hemocentro';
import { EstoqueSangue } from './EstoqueSangue';
import { Usuario } from './Usuario';

@Entity('registros_transfusao')
export class RegistroTransfusao {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PedidoTransfusao, { nullable: false })
  @JoinColumn({ name: 'request_id' })
  pedido: PedidoTransfusao;

  @ManyToOne(() => Hemocentro, { nullable: false })
  @JoinColumn({ name: 'hemocenter_id' })
  hemocentro: Hemocentro;

  @ManyToOne(() => EstoqueSangue, { nullable: false })
  @JoinColumn({ name: 'blood_inventory_id' })
  estoqueSangue: EstoqueSangue;

  @Column({ name: 'transfusion_date', nullable: false })
  dataTransfusao: Date;

  @Column({ name: 'start_time', nullable: false })
  horaInicio: Date;

  @Column({ name: 'end_time', nullable: true })
  horaFim: Date;

  @Column({ name: 'administered_quantity', nullable: false })
  quantidadeAdministrada: number;

  @Column({ name: 'blood_type', nullable: false, length: 5 })
  tipoSangue: string;

  @Column({ name: 'component_type', nullable: false })
  tipoComponente: string;

  // Sinais vitais - pré transfusão
  @Column({ name: 'pre_blood_pressure_systolic', type: 'double precision', nullable: false })
  prePressaoSistolica: number;

  @Column({ name: 'pre_blood_pressure_diastolic', type: 'double precision', nullable: false })
  prePressaoDiastolica: number;

  @Column({ name: 'pre_pulse', nullable: false })
  prePulso: number;

  @Column({ name: 'pre_temperature', type: 'double precision', nullable: false })
  preTemperatura: number;

  @Column({ name: 'pre_respiratory_rate', nullable: false })
  preFrequenciaRespiratoria: number;

  // Sinais vitais - durante transfusão
  @Column({ name: 'during_blood_pressure_systolic', type: 'double precision', nullable: true })
  durantePressaoSistolica: number;

  @Column({ name: 'during_blood_pressure_diastolic', type: 'double precision', nullable: true })
  durantePressaoDiastolica: number;

  @Column({ name: 'during_pulse', nullable: true })
  durantePulso: number;

  @Column({ name: 'during_temperature', type: 'double precision', nullable: true })
  duranteTemperatura: number;

  // Sinais vitais - pós transfusão
  @Column({ name: 'post_blood_pressure_systolic', type: 'double precision', nullable: true })
  posPressaoSistolica: number;

  @Column({ name: 'post_blood_pressure_diastolic', type: 'double precision', nullable: true })
  posPressaoDiastolica: number;

  @Column({ name: 'post_pulse', nullable: true })
  posPulso: number;

  @Column({ name: 'post_temperature', type: 'double precision', nullable: true })
  posTemperatura: number;

  @Column({ name: 'post_respiratory_rate', nullable: true })
  posFrequenciaRespiratoria: number;

  @Column({ name: 'adverse_reaction', default: false })
  reacaoAdversa: boolean;

  @Column({ name: 'adverse_reaction_description', nullable: true, length: 1000 })
  descricaoReacaoAdversa: string;

  @Column({ name: 'completed', default: false })
  concluida: boolean;

  @Column({ name: 'complications', nullable: true, length: 500 })
  complicacoes: string;

  @Column({ name: 'observations', nullable: true, length: 500 })
  observacoes: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'nurse_id' })
  enfermeiroResponsavel: Usuario;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'physician_id' })
  medicoSupervisor: Usuario;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receptor: Usuario;

  @Column({ name: 'created_at', nullable: false })
  criadoEm: Date;

  @Column({ name: 'updated_at', nullable: true })
  atualizadoEm: Date;

  @BeforeInsert()
  aoInserir() {
    this.criadoEm = new Date();
    this.atualizadoEm = new Date();
    if (!this.dataTransfusao) this.dataTransfusao = new Date();
    if (!this.horaInicio) this.horaInicio = new Date();
  }

  @BeforeUpdate()
  aoAtualizar() {
    this.atualizadoEm = new Date();
  }
}
