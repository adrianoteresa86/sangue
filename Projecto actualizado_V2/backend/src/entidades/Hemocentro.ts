import {
  Entity,
  PrimaryGeneratedColumn, DeleteDateColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('hemocentros')
export class Hemocentro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', nullable: false, length: 150 })
  nome: string;

  @Column({ name: 'address', nullable: true, length: 255 })
  endereco: string;

  @Column({ name: 'city', nullable: true, length: 100 })
  cidade: string;

  @Column({ name: 'state', nullable: true, length: 100 })
  estado: string;

  @Column({ name: 'phone', nullable: true, length: 30 })
  telefone: string;

  @Column({ name: 'email', nullable: true, length: 150 })
  email: string;

  @Column({ name: 'opening_hours', nullable: true, length: 100 })
  horarioFuncionamento: string;

  @Column({ name: 'description', nullable: true, length: 500 })
  descricao: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

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
