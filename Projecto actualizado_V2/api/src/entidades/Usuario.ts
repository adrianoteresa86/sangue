import {
  Entity,
  PrimaryGeneratedColumn, DeleteDateColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { PerfilDoador } from './PerfilDoador';
import { PerfilReceptor } from './PerfilReceptor';
import { PerfilHemocentro } from './PerfilHemocentro';

@Entity('usuarios')
@Unique(['email'])
@Unique(['telefone'])
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', nullable: true })
  nome: string;

  @Column({ name: 'email', nullable: false })
  email: string;

  @Column({ name: 'phone', nullable: true })
  telefone: string;

  @Column({ name: 'street', nullable: true })
  rua: string;

  @Column({ name: 'street_number', nullable: true })
  numero: string;

  @Column({ name: 'province', nullable: true })
  provincia: string;

  @Column({ name: 'neighborhood', nullable: true })
  bairro: string;

  @Column({ name: 'password', nullable: false })
  senha: string;

  @Column({ name: 'role', type: 'enum', enum: PerfilUsuario, nullable: false })
  perfil: PerfilUsuario;

  @Column({ name: 'enabled', default: true })
  ativo: boolean;

  @OneToOne(() => PerfilDoador, (p) => p.usuario, { cascade: true, eager: false })
  perfilDoador: PerfilDoador;

  @OneToOne(() => PerfilReceptor, (p) => p.usuario, { cascade: true, eager: false })
  perfilReceptor: PerfilReceptor;

  @OneToOne(() => PerfilHemocentro, (p) => p.usuario, { cascade: true, eager: false })
  perfilHemocentro: PerfilHemocentro;

  @CreateDateColumn({ name: 'created_at' })
  criadoEm: Date;


  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  apagadoEm: Date;}
