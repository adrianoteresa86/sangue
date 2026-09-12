import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';
import uploadControlador from './controladores/upload.controlador';
import { FonteDados } from './configuracao/banco';
import rotas from './rotas/index';
import rateLimit from 'express-rate-limit';

dotenv.config();

const aplicacao = express();
const porta = Number(process.env.PORT) || 8080;
const origemCors = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3001';

// Intermediários globais
aplicacao.use(cors({
  origin: origemCors.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
aplicacao.options('*', cors());

aplicacao.use(express.json());
aplicacao.use(express.urlencoded({ extended: true }));

import { auditoriaIntermediario } from './intermediarios/auditoria.intermediario';
aplicacao.use(auditoriaIntermediario);

// Rate Limiting (Proteção contra Brute Force / DDoS)
const limitadorGeral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP a cada 15 minutos
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
aplicacao.use('/api/', limitadorGeral);

// Documentação Swagger
const swaggerFicheiro = path.resolve(__dirname, '../swagger.json');
if (fs.existsSync(swaggerFicheiro)) {
  const swaggerDoc = JSON.parse(fs.readFileSync(swaggerFicheiro, 'utf-8'));
  aplicacao.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  console.log(`Documentação Swagger disponível em http://localhost:${porta}/api/v1/docs`);
}

// Ficheiros estáticos (documentos de autorização)
aplicacao.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Upload de documentos
aplicacao.use('/api/v1/uploads', uploadControlador);

// Rotas da API
aplicacao.use('/api/v1', rotas);

// Middleware Global de Tratamento de Erros
import { erroIntermediario } from './intermediarios/erro.intermediario';
aplicacao.use(erroIntermediario);

// Rota de saúde
aplicacao.get('/health', (_req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

// Inicializar ligação ao banco de dados e arrancar servidor
FonteDados.initialize()
  .then(() => {
    console.log('Ligação ao banco de dados estabelecida com sucesso');

    if (process.env.VERCEL !== '1') {
      aplicacao.listen(porta, () => {
        console.log(`Servidor Sangue a correr na porta ${porta}`);
        console.log(`API disponível em http://localhost:${porta}/api/v1`);
      });
    }
  })
  .catch((erro) => {
    console.error('Erro ao ligar ao banco de dados:', erro);
    // process.exit(1);
  });

export default aplicacao;
