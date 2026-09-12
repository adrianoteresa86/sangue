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
import { RegistroDoacao } from './RegistroDoacao';
import { StatusTeste } from '../utilitarios/status-teste.enum';

@Entity('testes_sangue')
export class TesteSangue {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => RegistroDoacao, { nullable: false })
  @JoinColumn({ name: 'donation_record_id' })
  registroDoacao: RegistroDoacao;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  tecnico: Usuario;

  @Column({ name: 'status', type: 'enum', enum: StatusTeste, default: StatusTeste.PENDENTE })
  status: StatusTeste;

  @Column({ name: 'hiv', nullable: true })
  hiv: boolean;

  @Column({ name: 'hepatitis_b', nullable: true })
  hepatiteB: boolean;

  @Column({ name: 'hepatitis_c', nullable: true })
  hepatiteC: boolean;

  @Column({ name: 'syphilis', nullable: true })
  sifilis: boolean;

  @Column({ name: 'chagas', nullable: true })
  chagas: boolean;

  @Column({ name: 'htlv', nullable: true })
  htlv: boolean;

  @Column({ name: 'confirmed_blood_type', nullable: true, length: 5 })
  tipoSanguineo: string;

  @Column({ name: 'rh_factor', nullable: true })
  fatorRh: boolean;

  @Column({ name: 'observations', nullable: true, length: 1000 })
  observacoes: string;

  @Column({ name: 'test_date', nullable: false })
  dataTeste: Date;

  @Column({ name: 'completed_date', nullable: true })
  dataConclusao: Date;

  @Column({ name: 'created_at', nullable: false })
  criadoEm: Date;

  @Column({ name: 'updated_at', nullable: true })
  atualizadoEm: Date;

  @BeforeInsert()
  aoInserir() {
    this.criadoEm = new Date();
    this.atualizadoEm = new Date();
    if (!this.dataTeste) this.dataTeste = new Date();
  }

  @BeforeUpdate()
  aoAtualizar() {
    this.atualizadoEm = new Date();
  }
}
