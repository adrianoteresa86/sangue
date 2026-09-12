import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { DateInput } from '../../common/DateInput';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

const usuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  tipoSangue: z.string().optional(),
  peso: z.number().optional(),
  altura: z.number().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  provincia: z.string().optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  perfil: z.enum(['ADMIN', 'DOADOR', 'COORDENADOR_HEMOCENTRO', 'TECNICO_HEMOCENTRO', 'RECEPTOR']),
  ativo: z.boolean(),
  hemocentroId: z.string().optional(),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

interface UsuarioFormProps {
  onSubmit: (data: UsuarioFormData) => void;
  initialData?: Partial<UsuarioFormData>;
  loading?: boolean;
  title: string;
  onCancel?: () => void;
  hemocentros?: Array<{ id: string | number; nome: string }>;
}

export const UsuarioForm: React.FC<UsuarioFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  title,
  onCancel,
  hemocentros = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: initialData,
  });

  const perfilSelecionado = watch('perfil');

  useEffect(() => {
    reset(initialData || {});
  }, [initialData, reset]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome"
                placeholder="Nome completo"
                {...register('nome')}
                error={errors.nome?.message}
              />

              <Input
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Input
                label="Telefone"
                placeholder="+244 923 456 789"
                {...register('telefone')}
                error={errors.telefone?.message}
              />

              <DateInput
                label="Data de Nascimento"
                {...register('dataNascimento')}
                error={errors.dataNascimento?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Sanguíneo
                </label>
                <select
                  {...register('tipoSangue')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {errors.tipoSangue && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoSangue.message}</p>
                )}
              </div>

              <Input
                label="Peso (kg)"
                type="number"
                step="0.1"
                placeholder="70.5"
                {...register('peso', { valueAsNumber: true })}
                error={errors.peso?.message}
              />

              <Input
                label="Altura (cm)"
                type="number"
                placeholder="175"
                {...register('altura', { valueAsNumber: true })}
                error={errors.altura?.message}
              />

              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...register('senha')}
                error={errors.senha?.message}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Rua"
                placeholder="Avenida 21 de Fevereiro"
                {...register('rua')}
                error={errors.rua?.message}
              />

              <Input
                label="Número"
                placeholder="1234"
                {...register('numero')}
                error={errors.numero?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Província
                </label>
                <select
                  {...register('provincia')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="Luanda">Luanda</option>
                  <option value="Benguela">Benguela</option>
                  <option value="Huambo">Huambo</option>
                  <option value="Huíla">Huíla</option>
                  <option value="Cabinda">Cabinda</option>
                  <option value="Cunene">Cunene</option>
                  <option value="Cuando Cubango">Cuando Cubango</option>
                  <option value="Kwanza Norte">Kwanza Norte</option>
                  <option value="Kwanza Sul">Kwanza Sul</option>
                  <option value="Malanje">Malanje</option>
                  <option value="Moxico">Moxico</option>
                  <option value="Namibe">Namibe</option>
                  <option value="Uíge">Uíge</option>
                  <option value="Zaire">Zaire</option>
                  <option value="Cuanza Norte">Cuanza Norte</option>
                  <option value="Cuanza Sul">Cuanza Sul</option>
                  <option value="Lunda Norte">Lunda Norte</option>
                  <option value="Lunda Sul">Lunda Sul</option>
                </select>
                {errors.provincia && (
                  <p className="text-red-500 text-sm mt-1">{errors.provincia.message}</p>
                )}
              </div>

              <Input
                label="Bairro"
                placeholder="Patrice Lumumba"
                {...register('bairro')}
                error={errors.bairro?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perfil
            </label>
            <select
              {...register('perfil')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecione um perfil</option>
              <option value="ADMIN">Administrador</option>
              <option value="DOADOR">Doador</option>
              <option value="RECEPTOR">Receptor</option>
              <option value="COORDENADOR_HEMOCENTRO">Coordenador Hemocentro</option>
              <option value="TECNICO_HEMOCENTRO">Técnico Hemocentro</option>
            </select>
            {errors.perfil && (
              <p className="text-red-500 text-sm mt-1">{errors.perfil.message}</p>
            )}
          </div>

          {(perfilSelecionado === 'COORDENADOR_HEMOCENTRO' || perfilSelecionado === 'TECNICO_HEMOCENTRO') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hemocentro
              </label>
              <select
                {...register('hemocentroId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione um hemocentro</option>
                {hemocentros.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome}
                  </option>
                ))}
              </select>
              {errors.hemocentroId && (
                <p className="text-red-500 text-sm mt-1">{errors.hemocentroId.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              {...register('ativo')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
              Usuário ativo
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel ? onCancel : () => window.history.back()}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};
