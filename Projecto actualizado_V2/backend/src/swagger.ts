import swaggerAutogen from 'swagger-autogen';
import * as path from 'path';

const doc = {
  info: {
    title: 'Sangue API',
    description: 'API do sistema Sangue — gestão de doações de sangue, hemocentros, campanhas e transfusões.',
    version: '1.0.0',
  },
  host: 'localhost:8080',
  basePath: '/api/v1',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Token JWT no formato: Bearer {token}',
    },
  },
  tags: [
    { name: 'Autenticação', description: 'Login, registo e validação de token' },
    { name: 'Utilizadores', description: 'Gestão de utilizadores (ADMIN)' },
    { name: 'Doadores', description: 'Perfil e gestão de doadores' },
    { name: 'Hemocentros', description: 'Gestão de hemocentros' },
    { name: 'Estoque de Sangue', description: 'Controlo do estoque de sangue' },
    { name: 'Campanhas', description: 'Campanhas de doação' },
    { name: 'Registos de Doação', description: 'Registos de doações realizadas' },
    { name: 'Agendamentos de Doação', description: 'Agendamento de doações' },
    { name: 'Pedidos de Transfusão', description: 'Pedidos de transfusão de sangue' },
    { name: 'Registos de Transfusão', description: 'Registos de transfusões realizadas' },
    { name: 'Notificações', description: 'Notificações de utilizadores' },
    { name: 'Estatísticas', description: 'Estatísticas gerais do sistema' },
    { name: 'Receptor', description: 'Funcionalidades exclusivas do utilizador Receptor de sangue' },
  ],
  definitions: {
    LoginDto: {
      $email: 'utilizador@exemplo.com',
      $senha: 'senha123',
    },
    RegistoDto: {
      $nome: 'João Silva',
      $email: 'joao@exemplo.com',
      $senha: 'senha123',
      telefone: '+258841234567',
      perfil: 'DOADOR',
    },
    CriarUtilizadorDto: {
      $nome: 'João Silva',
      $email: 'joao@exemplo.com',
      $senha: 'senha123',
      telefone: '+258841234567',
      perfil: 'DOADOR',
      ativo: true,
    },
    ActualizarUtilizadorDto: {
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      telefone: '+258841234567',
      perfil: 'DOADOR',
      ativo: true,
    },
    ReceptorSolicitarDto: {
      $tipoSangue: 'O-',
      $volume: 500,
      $urgencia: 'urgente',
      $motivo: 'Cirurgia programada',
      observacoes: 'Sem intolerâncias conhecidas',
      idHemocentro: 1,
      precisaAte: '2026-05-10T18:00:00Z',
    },
    ReceptorAtualizarPerfilDto: {
      nome: 'Maria Silva',
      email: 'maria@email.com',
      telefone: '+258841234567',
      rua: 'Av. Eduardo Mondlane',
      numero: '100',
      bairro: 'Sommerschield',
      provincia: 'Maputo',
      dataNascimento: '1990-05-15',
      tipoSanguineo: 'O-',
      peso: 65.5,
      altura: 165,
      historicoMedico: 'Hipertensão controlada',
      genero: 'F',
    },
    ReceptorDashboardResponse: {
      ativos: 3,
      concluidas: 12,
      canceladas: 2,
      tipoSanguineo: 'O-',
      recentes: [],
    },
    ReceptorHistoricoResponse: {
      total: 12,
      totalLitros: 5.2,
      esteAno: 3,
      transfusoes: [],
    },
  },
};

const outputFile = path.resolve(__dirname, '../swagger.json');
const endpointsFiles = [
  './src/rotas/index.ts',
];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
