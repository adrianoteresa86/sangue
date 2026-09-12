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
import { Usuario } from './Usuario';
import { Hemocentro } from './Hemocentro';
import { AgendamentoDoacao } from './AgendamentoDoacao';

@Entity('registros_doacoes')
export class RegistroDoacao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'doador_id' })
  doador: Usuario;

  @ManyToOne(() => Hemocentro, { nullable: false })
  @JoinColumn({ name: 'hemocentro_id' })
  hemocentro: Hemocentro;

  @OneToOne(() => AgendamentoDoacao, { nullable: true })
  @JoinColumn({ name: 'agendamento_id' })
  agendamento: AgendamentoDoacao;

  @Column({ name: 'data_doacao', nullable: false })
  dataDoacao: Date;

  @Column({ name: 'quantidade_ml', nullable: false })
  quantidade: number;

  @Column({ name: 'tipo_sanguineo', nullable: false, length: 5 })
  tipoSangue: string;

  @Column({ name: 'component_type', nullable: false })
  tipoComponente: string;

  @Column({ name: 'hemoglobin_level', type: 'double precision', nullable: false })
  nivelHemoglobina: number;

  @Column({ name: 'blood_pressure_systolic', type: 'double precision', nullable: false })
  pressaoSistolica: number;

  @Column({ name: 'blood_pressure_diastolic', type: 'double precision', nullable: false })
  pressaoDiastolica: number;

  @Column({ name: 'pulse', nullable: false })
  pulso: number;

  @Column({ name: 'temperature', type: 'double precision', nullable: false })
  temperatura: number;

  @Column({ name: 'weight', type: 'double precision', nullable: false })
  peso: number;

  @Column({ name: 'observations', nullable: true, length: 500 })
  observacoes: string;

  @Column({ name: 'eligible', default: true })
  elegivel: boolean;

  @Column({ name: 'ineligibility_reason', nullable: true, length: 500 })
  motivoInelegibilidade: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  tecnico: Usuario;

  @Column({ name: 'created_at', nullable: false })
  criadoEm: Date;

  @Column({ name: 'updated_at', nullable: true })
  atualizadoEm: Date;

  @BeforeInsert()
  aoInserir() {
    this.criadoEm = new Date();
    this.atualizadoEm = new Date();
    if (!this.dataDoacao) this.dataDoacao = new Date();
  }

  @BeforeUpdate()
  aoAtualizar() {
    this.atualizadoEm = new Date();
  }
}
