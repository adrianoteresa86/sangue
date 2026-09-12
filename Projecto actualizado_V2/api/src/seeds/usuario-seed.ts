import 'reflect-metadata';
import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';
import { PerfilDoador } from '../entidades/PerfilDoador';
import { PerfilReceptor } from '../entidades/PerfilReceptor';
import { PerfilHemocentro } from '../entidades/PerfilHemocentro';
import { Hemocentro } from '../entidades/Hemocentro';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import * as bcrypt from 'bcryptjs';

async function criarSeedUsuarios() {
  await FonteDados.initialize();
  // Sincronizar entidades para criar tabelas se não existirem
  await FonteDados.synchronize(true);
  
  const usuarioRepository = FonteDados.getRepository(Usuario);
  const perfilDoadorRepository = FonteDados.getRepository(PerfilDoador);
  const perfilReceptorRepository = FonteDados.getRepository(PerfilReceptor);
  const perfilHemocentroRepository = FonteDados.getRepository(PerfilHemocentro);
  const hemocentroRepository = FonteDados.getRepository(Hemocentro);

  // Limpar tabelas existentes
  await FonteDados.query('TRUNCATE TABLE perfis_doadores RESTART IDENTITY CASCADE');
  await FonteDados.query('TRUNCATE TABLE perfis_receptores RESTART IDENTITY CASCADE');
  await FonteDados.query('TRUNCATE TABLE perfil_hemocentro RESTART IDENTITY CASCADE');
  await FonteDados.query('TRUNCATE TABLE hemocentros RESTART IDENTITY CASCADE');
  await FonteDados.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE');

  // Criar Hemocentro
  const hemocentro = new Hemocentro();
  hemocentro.nome = 'Hemocentro Nacional';
  hemocentro.endereco = 'Avenida de Luanda, 100';
  hemocentro.cidade = 'Luanda';
  hemocentro.estado = 'Luanda';
  hemocentro.telefone = '+244 911 111 111';
  hemocentro.email = 'contato@hemocentronacional.ao';
  hemocentro.horarioFuncionamento = '08:00 - 18:00';
  const hemocentroCriado = await hemocentroRepository.save(hemocentro);

  // Senhas criptografadas
  const senhaPadrao = await bcrypt.hash('123456', 10);

  // Criar usuários
  const usuarios = [
    {
      nome: 'Admin Master',
      email: 'admin@doarfazbem.com',
      telefone: '+244 922 000 001',
      rua: 'Rua Admin',
      numero: '1',
      bairro: 'Centro',
      provincia: 'Luanda',
      senha: senhaPadrao,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
    {
      nome: 'João Doador',
      email: 'doador@doarfazbem.com',
      telefone: '+244 922 000 002',
      rua: 'Rua Doador',
      numero: '2',
      bairro: 'Maianga',
      provincia: 'Luanda',
      senha: senhaPadrao,
      perfil: PerfilUsuario.DOADOR,
      ativo: true,
    },
    {
      nome: 'Maria Receptora',
      email: 'receptor@doarfazbem.com',
      telefone: '+244 922 000 003',
      rua: 'Rua Receptor',
      numero: '3',
      bairro: 'Viana',
      provincia: 'Luanda',
      senha: senhaPadrao,
      perfil: PerfilUsuario.RECEPTOR,
      ativo: true,
    },
    {
      nome: 'Carlos Coordenador',
      email: 'coordenador@doarfazbem.com',
      telefone: '+244 922 000 004',
      rua: 'Rua Coordenador',
      numero: '4',
      bairro: 'Talatona',
      provincia: 'Luanda',
      senha: senhaPadrao,
      perfil: PerfilUsuario.COORDENADOR_HEMOCENTRO,
      ativo: true,
    },
    {
      nome: 'Ana Técnica',
      email: 'tecnico@doarfazbem.com',
      telefone: '+244 922 000 005',
      rua: 'Rua Técnico',
      numero: '5',
      bairro: 'Talatona',
      provincia: 'Luanda',
      senha: senhaPadrao,
      perfil: PerfilUsuario.TECNICO_HEMOCENTRO,
      ativo: true,
    }
  ];

  const usuariosCriados = await usuarioRepository.save(usuarios);

  // Criar Relações de Perfis
  for (const u of usuariosCriados) {
    if (u.perfil === PerfilUsuario.DOADOR) {
      const perfil = new PerfilDoador();
      perfil.usuario = u;
      perfil.idade = 30;
      perfil.peso = 70.0;
      perfil.tipoSangue = 'O+';
      await perfilDoadorRepository.save(perfil);
    } 
    else if (u.perfil === PerfilUsuario.RECEPTOR) {
      const perfil = new PerfilReceptor();
      perfil.usuario = u;
      perfil.dataNascimento = new Date('1990-01-01');
      perfil.tipoSanguineo = 'AB-';
      perfil.peso = 65.0;
      perfil.altura = 1.70;
      perfil.historicoMedico = 'Nenhum';
      perfil.genero = 'Feminino';
      await perfilReceptorRepository.save(perfil);
    }
    else if (u.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO) {
      const perfil = new PerfilHemocentro();
      perfil.usuario = u;
      perfil.hemocentro = hemocentroCriado;
      perfil.cargo = 'Coordenador Geral';
      await perfilHemocentroRepository.save(perfil);
    }
    else if (u.perfil === PerfilUsuario.TECNICO_HEMOCENTRO) {
      const perfil = new PerfilHemocentro();
      perfil.usuario = u;
      perfil.hemocentro = hemocentroCriado;
      perfil.cargo = 'Técnico de Laboratório';
      await perfilHemocentroRepository.save(perfil);
    }
  }

  console.log('\n=== Usuários Criados ===');
  usuariosCriados.forEach(usuario => {
    console.log(`- ${usuario.nome} (${usuario.email}) - Perfil: ${usuario.perfil}`);
  });
  console.log('\nSenha para todos os usuários: 123456');

  await FonteDados.destroy();
  console.log('\nSeed concluído com sucesso!');
}

criarSeedUsuarios().catch(error => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
