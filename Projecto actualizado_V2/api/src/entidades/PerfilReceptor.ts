import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity('perfis_receptores')
export class PerfilReceptor {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Usuario, (u) => u.perfilReceptor)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: Date;

  @Column({ name: 'tipo_sanguineo', nullable: true, length: 10 })
  tipoSanguineo: string;

  @Column({ name: 'peso', type: 'double precision', nullable: true })
  peso: number;

  @Column({ name: 'altura', type: 'double precision', nullable: true })
  altura: number;

  @Column({ name: 'historico_medico', type: 'text', nullable: true })
  historicoMedico: string;

  @Column({ name: 'genero', nullable: true, length: 20 })
  genero: string;
}
