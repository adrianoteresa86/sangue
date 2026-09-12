import 'reflect-metadata';
import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';
import { PerfilDoador } from '../entidades/PerfilDoador';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import * as bcrypt from 'bcryptjs';

async function criarSeedUsuarios() {
  await FonteDados.initialize();
  // Sincronizar entidades para criar tabelas se não existirem
  await FonteDados.synchronize(true);
  const usuarioRepository = FonteDados.getRepository(Usuario);
  const perfilDoadorRepository = FonteDados.getRepository(PerfilDoador);

  // Limpar usuários existentes
  await FonteDados.query('TRUNCATE TABLE perfis_doadores RESTART IDENTITY CASCADE');
  await FonteDados.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE');

  // Senhas criptografadas
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  const senhaDoador = await bcrypt.hash('doador123', 10);
  const senhaReceptor = await bcrypt.hash('receptor123', 10);

  // Criar usuários
  const usuarios = [
    {
      nome: 'Administrador do Sistema',
      email: 'admin@doarfazbem.com',
      telefone: '+244 923 456 789',
      rua: 'Avenida 21 de Fevereiro',
      numero: '1234',
      bairro: 'Patrice Lumumba',
      provincia: 'Luanda',
      senha: senhaAdmin,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
    {
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      telefone: '+244 912 345 678',
      rua: 'Rua Comandante Gika',
      numero: '567',
      bairro: 'Alvalade',
      provincia: 'Luanda',
      senha: senhaDoador,
      perfil: PerfilUsuario.DOADOR,
      ativo: true,
    },
    {
      nome: 'Hemocentro Central',
      email: 'receptor@doarfazbem.com',
      telefone: '+244 934 567 890',
      rua: 'Avenida Ho Chi Minh',
      numero: '890',
      bairro: 'Maianga',
      provincia: 'Maputo',
      senha: senhaReceptor,
      perfil: PerfilUsuario.RECEPTOR,
      ativo: true,
    },
  ];

  const usuariosCriados = await usuarioRepository.save(usuarios);

  // Criar perfil do doador para o usuário João Silva
  const usuarioDoador = usuariosCriados.find(u => u.email === 'joao.silva@email.com');
  if (usuarioDoador) {
    const perfilDoador = new PerfilDoador();
    perfilDoador.usuario = usuarioDoador;
    perfilDoador.idade = 28;
    perfilDoador.peso = 75.5;
    perfilDoador.tipoSangue = 'O+';

    await perfilDoadorRepository.save(perfilDoador);

  }

  console.log('\n=== Usuários Criados ===');
  usuariosCriados.forEach(usuario => {
    console.log(`- ${usuario.nome} (${usuario.email}) - Perfil: ${usuario.perfil}`);
  });

  await FonteDados.destroy();
  console.log('\nSeed concluído com sucesso!');
}

criarSeedUsuarios().catch(error => {
  console.error('Erro ao executar seed:', error);
  process.exit(1);
});
