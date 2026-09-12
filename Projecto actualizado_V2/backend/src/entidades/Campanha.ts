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

@Entity('campanhas')
export class Campanha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'title', nullable: false, length: 200 })
  titulo: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  descricao: string;

  @Column({ name: 'start_date', type: 'date', nullable: false })
  dataInicio: string;

  @Column({ name: 'end_date', type: 'date', nullable: false })
  dataFim: string;

  @Column({ name: 'target_blood_type', nullable: true, length: 100 })
  tipoSanguineo: string;

  @Column({ name: 'target_donations', nullable: false })
  metaDoacoes: number;

  @Column({ name: 'current_donations', nullable: false, default: 0 })
  doacoesAtuais: number;

  @ManyToOne(() => Hemocentro, { nullable: false })
  @JoinColumn({ name: 'hemocenter_id' })
  hemocentro: Hemocentro;

  @Column({ name: 'active', default: true })
  ativo: boolean;

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
