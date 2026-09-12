import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity('perfis_doadores')
export class PerfilDoador {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Usuario, (u) => u.perfilDoador)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ nullable: true })
  idade: number;

  @Column({ name: 'peso', type: 'double precision', nullable: true })
  peso: number;

  @Column({ name: 'tipo_sanguineo', nullable: true })
  tipoSangue: string;

  @Column({ name: 'genero', nullable: true, length: 20 })
  genero: string; // 'MASCULINO' | 'FEMININO'
}
