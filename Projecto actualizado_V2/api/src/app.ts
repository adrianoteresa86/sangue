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
import { auditoriaIntermediario } from './intermediarios/auditoria.intermediario';
import { erroIntermediario } from './intermediarios/erro.intermediario';

dotenv.config();

const aplicacao = express();
aplicacao.set('trust proxy', 1); // Confiar no proxy reverso do Vercel para o rate limit funcionar corretamente
const porta = Number(process.env.PORT) || 8080;
const origemCors = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3001';

// Intermediários globais
aplicacao.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

aplicacao.use(express.json());
aplicacao.use(express.urlencoded({ extended: true }));

// Rate Limiting (Proteção contra Brute Force / DDoS)
const limitadorGeral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP a cada 15 minutos
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
aplicacao.use('/api/', limitadorGeral);

// Inicializar banco de dados para Serverless (Vercel)
let isDbInitialized = false;
const initDb = async () => {
  if (!isDbInitialized) {
    try {
      await FonteDados.initialize();
      isDbInitialized = true;
      console.log('Ligação ao banco de dados estabelecida com sucesso');
    } catch (erro) {
      console.error('Erro ao ligar ao banco de dados:', erro);
      throw erro;
    }
  }
};

// Middleware para garantir que o banco está conectado antes das rotas e auditoria
aplicacao.use('/api', async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno de conexão ao banco de dados' });
  }
});

// Middleware de auditoria (precisa do banco de dados)
aplicacao.use(auditoriaIntermediario);

// Documentação Swagger
const swaggerFicheiro = path.resolve(__dirname, '../swagger.json');
if (fs.existsSync(swaggerFicheiro)) {
  const swaggerDoc = JSON.parse(fs.readFileSync(swaggerFicheiro, 'utf-8'));
  aplicacao.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

// Ficheiros estáticos (documentos de autorização)
aplicacao.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Upload de documentos
aplicacao.use('/api/v1/uploads', uploadControlador);

// Rotas da API
aplicacao.use('/api/v1', rotas);

// Middleware Global de Tratamento de Erros
aplicacao.use(erroIntermediario);

// Rota de saúde
aplicacao.get('/health', (_req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.VERCEL !== '1') {
  initDb().then(() => {
    aplicacao.listen(porta, () => {
      console.log(`Servidor Sangue a correr na porta ${porta}`);
      console.log(`API disponível em http://localhost:${porta}/api/v1`);
    });
  });
}

export default aplicacao;
