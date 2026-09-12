import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Usuario } from '../entidades/Usuario';
import { PerfilDoador } from '../entidades/PerfilDoador';
import { PerfilReceptor } from '../entidades/PerfilReceptor';
import { Hemocentro } from '../entidades/Hemocentro';
import { PerfilHemocentro } from '../entidades/PerfilHemocentro';
import { Campanha } from '../entidades/Campanha';
import { AgendamentoDoacao } from '../entidades/AgendamentoDoacao';
import { RegistroDoacao } from '../entidades/RegistroDoacao';
import { EstoqueSangue } from '../entidades/EstoqueSangue';
import { TesteSangue } from '../entidades/TesteSangue';
import { PedidoTransfusao } from '../entidades/PedidoTransfusao';
import { RegistroTransfusao } from '../entidades/RegistroTransfusao';
import { Notificacao } from '../entidades/Notificacao';
import { Auditoria } from '../entidades/Auditoria';

dotenv.config();

export const FonteDados = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'doador',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_HOST?.includes('supabase') ? { 
    rejectUnauthorized: false
  } : false,
  migrations: ['src/migrations/*.ts'],
  entities: [
    Usuario,
    PerfilDoador,
    PerfilReceptor,
    PerfilHemocentro,
    Hemocentro,
    Campanha,
    AgendamentoDoacao,
    RegistroDoacao,
    EstoqueSangue,
    TesteSangue,
    PedidoTransfusao,
    RegistroTransfusao,
    Notificacao,
    Auditoria,
  ]
});
