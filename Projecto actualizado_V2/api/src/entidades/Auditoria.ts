import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';

@Entity('auditorias')
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  acao: string; // POST, PUT, DELETE, etc.

  @Column()
  entidade: string; // Endpoint or Table name

  @Column('jsonb', { nullable: true })
  detalhes: any; // Request body or params

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ nullable: true })
  usuario_id: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
