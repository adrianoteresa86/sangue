import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Hemocentro } from './Hemocentro';

@Entity('perfil_hemocentro')
export class PerfilHemocentro {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Usuario, (u) => u.perfilHemocentro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  usuario: Usuario;

  @ManyToOne(() => Hemocentro, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'hemocenter_id' })
  hemocentro: Hemocentro;

  @Column({ name: 'position', nullable: true, length: 100 })
  cargo: string;
}
