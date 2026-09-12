import {
  Entity,
  PrimaryGeneratedColumn, DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Hemocentro } from './Hemocentro';
import { Usuario } from './Usuario';
import { StatusTransfusao } from '../utilitarios/status-transfusao.enum';

@Entity('pedidos_transfusao')
export class PedidoTransfusao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hemocentro, { nullable: true })
  @JoinColumn({ name: 'hemocenter_id' })
  hemocentro: Hemocentro;

  @Column({ name: 'patient_name', nullable: false, length: 200 })
  nomePaciente: string;

  @Column({ name: 'patient_blood_type', nullable: false, length: 20 })
  tipoSanguinePaciente: string;

  @Column({ name: 'patient_age', nullable: false })
  idadePaciente: number;

  @Column({ name: 'patient_gender', nullable: false, length: 10 })
  generoPaciente: string;

  @Column({ name: 'medical_record_number', nullable: false, length: 50 })
  numeroProntuario: string;

  @Column({ name: 'diagnosis', nullable: false })
  diagnostico: string;

  @Column({ name: 'component_type', nullable: false })
  tipoComponente: string;

  @Column({ name: 'requested_quantity', nullable: false })
  quantidadeSolicitada: number;

  @Column({ name: 'urgency_level', nullable: false })
  nivelUrgencia: number;

  @Column({ name: 'requested_date', nullable: false })
  dataSolicitacao: Date;

  @Column({ name: 'needed_by', nullable: false })
  precisaAte: Date;

  @Column({ name: 'clinical_indication', nullable: true, length: 500 })
  indicacaoClinica: string;

  @Column({ name: 'status', type: 'enum', enum: StatusTransfusao, default: StatusTransfusao.PENDENTE })
  status: StatusTransfusao;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receptor: Usuario;

  @Column({ name: 'physician_contact', nullable: true, length: 100 })
  contatoMedico: string;

  @Column({ name: 'notes', nullable: true, length: 500 })
  observacoes: string;

  @Column({ name: 'url_documento_autorizacao', nullable: true, length: 500 })
  urlDocumentoAutorizacao: string;

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
    if (!this.status) this.status = StatusTransfusao.PENDENTE;
    if (!this.dataSolicitacao) this.dataSolicitacao = new Date();
  }

  @BeforeUpdate()
  aoAtualizar() {
    this.atualizadoEm = new Date();
  }
}
