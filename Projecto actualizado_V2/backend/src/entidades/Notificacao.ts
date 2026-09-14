import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Usuario } from './Usuario';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';

@Entity('notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  destinatario: Usuario;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'remetente_id' })
  remetente: Usuario;

  @Column({ name: 'title', nullable: false, length: 200 })
  titulo: string;

  @Column({ name: 'message', type: 'text', nullable: false })
  mensagem: string;

  @Column({ name: 'type', type: 'enum', enum: TipoNotificacao, nullable: false })
  tipo: TipoNotificacao;

  @Column({ name: 'is_read', default: false })
  lida: boolean;

  @Column({ name: 'created_at', nullable: false })
  criadoEm: Date;

  @Column({ name: 'read_at', nullable: true })
  lidaEm: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiraEm: Date;

  @Column({ name: 'related_entity_type', nullable: true })
  tipoEntidadeRelacionada: string;

  @Column({ name: 'related_entity_id', nullable: true })
  idEntidadeRelacionada: number;

  @Column({ name: 'notificacao_pai_id', nullable: true })
  notificacaoPaiId: number;

  @Column({ name: 'email_sent', default: false })
  emailEnviado: boolean;

  @Column({ name: 'sms_sent', default: false })
  smsEnviado: boolean;

  @Column({ name: 'push_notification_sent', default: false })
  pushEnviado: boolean;

  @BeforeInsert()
  aoInserir() {
    this.criadoEm = new Date();
  }
}
