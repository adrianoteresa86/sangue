import {
  Entity,
  PrimaryGeneratedColumn, DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Hemocentro } from './Hemocentro';
import { StatusDoacao } from '../utilitarios/status-doacao.enum';

@Entity('agendamentos_doacoes')
export class AgendamentoDoacao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  usuario: Usuario;

  @ManyToOne(() => Hemocentro, { nullable: false })
  @JoinColumn({ name: 'hemocenter_id' })
  hemocentro: Hemocentro;

  @Column({ name: 'preferred_date', nullable: false })
  dataPreferida: Date;

  @Column({ name: 'preferred_time', nullable: true, length: 10 })
  horaPreferida: string;

  @Column({ name: 'blood_type', nullable: false, length: 5 })
  tipoSangue: string;

  @Column({ name: 'status', type: 'enum', enum: StatusDoacao, default: StatusDoacao.PENDENTE })
  status: StatusDoacao;

  @Column({ name: 'notes', nullable: true, length: 500 })
  observacoes: string;

  @Column({ name: 'emergency_contact_name', nullable: true, length: 200 })
  nomeContatoEmergencia: string;

  @Column({ name: 'emergency_contact_phone', nullable: true, length: 30 })
  telefoneContatoEmergencia: string;

  @Column({ name: 'city', nullable: true, length: 100 })
  cidade: string;

  @Column({ name: 'nova_data_solicitada', nullable: true, type: 'timestamp' })
  novaDataSolicitada: Date;

  @Column({ name: 'nova_hora_solicitada', nullable: true, length: 10 })
  novaHoraSolicitada: string;

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
  }

  @BeforeUpdate()
  aoAtualizar() {
    this.atualizadoEm = new Date();
  }
}
