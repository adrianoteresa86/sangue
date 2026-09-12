import { IsString, IsEmail, IsEnum, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

export class CriarUsuarioDto {
  @IsString({ message: 'O nome deve ser uma string válida' })
  nome: string;

  @IsEmail({}, { message: 'O email fornecido não é válido' })
  email: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string válida' })
  telefone?: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @IsOptional()
  @IsEnum(PerfilUsuario, { message: 'Perfil inválido (deve ser DOADOR, ADMIN ou RECEPTOR)' })
  perfil?: PerfilUsuario;

  @IsOptional()
  @IsBoolean({ message: 'O status ativo deve ser booleano (true/false)' })
  ativo?: boolean;
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string válida' })
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'O email fornecido não é válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string válida' })
  telefone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha?: string;

  @IsOptional()
  @IsEnum(PerfilUsuario, { message: 'Perfil inválido (deve ser DOADOR, ADMIN ou RECEPTOR)' })
  perfil?: PerfilUsuario;

  @IsOptional()
  @IsBoolean({ message: 'O status ativo deve ser booleano (true/false)' })
  ativo?: boolean;
}
