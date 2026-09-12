import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { CheckCircle, Scale, Dumbbell, Moon, Utensils, IdCard, CalendarDays, User } from 'lucide-react';

const perfilDoadorSchema = z.object({
  usuarioId: z.number().min(1, 'Usuário é obrigatório'),
  idade: z.number().min(18, 'Idade mínima é 18 anos').max(65, 'Idade máxima é 65 anos').optional(),
  peso: z.number().min(50, 'Peso mínimo é 50 kg').optional(),
  tipoSangue: z.string().max(5, 'Máximo 5 caracteres').optional(),
  genero: z.enum(['MASCULINO', 'FEMININO', '']).optional(),
});

type PerfilDoadorFormData = z.infer<typeof perfilDoadorSchema>;

interface PerfilDoadorFormProps {
  onSubmit: (data: PerfilDoadorFormData) => void;
  initialData?: Partial<PerfilDoadorFormData>;
  loading?: boolean;
  title: string;
  usuarios?: Array<{ id: number; nome: string; email: string }>;
  onCancel?: () => void;
}

export const PerfilDoadorForm: React.FC<PerfilDoadorFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  title,
  usuarios = [],
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerfilDoadorFormData>({
    resolver: zodResolver(perfilDoadorSchema),
    defaultValues: {
      usuarioId: initialData?.usuarioId || 0,
      idade: initialData?.idade,
      peso: initialData?.peso,
      tipoSangue: initialData?.tipoSangue || '',
      genero: (initialData?.genero as 'MASCULINO' | 'FEMININO' | '') || '',
    },
  });

  useEffect(() => {
    reset({
      usuarioId: initialData?.usuarioId || 0,
      idade: initialData?.idade,
      peso: initialData?.peso,
      tipoSangue: initialData?.tipoSangue || '',
      genero: (initialData?.genero as 'MASCULINO' | 'FEMININO' | '') || '',
    });
  }, [initialData, reset]);

  const tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Usuário */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <select
                {...register('usuarioId', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="0">Selecione um usuário</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome} ({usuario.email})
                  </option>
                ))}
              </select>
              {errors.usuarioId && (
                <p className="text-red-500 text-sm mt-1">{errors.usuarioId.message}</p>
              )}
            </div>

            {/* Género */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                {...register('genero')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione (opcional)</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>
              {errors.genero && (
                <p className="text-red-500 text-sm mt-1">{errors.genero.message}</p>
              )}
            </div>

            {/* Idade */}
            <Input
              label="Idade"
              type="number"
              min="18"
              max="65"
              placeholder="25"
              {...register('idade', { valueAsNumber: true })}
              error={errors.idade?.message}
            />

            {/* Peso */}
            <Input
              label="Peso (kg)"
              type="number"
              step="0.1"
              min="50"
              placeholder="70.5"
              {...register('peso', { valueAsNumber: true })}
              error={errors.peso?.message}
            />

            {/* Tipo Sanguíneo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Sanguíneo
              </label>
              <select
                {...register('tipoSangue')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione (opcional)</option>
                {tiposSanguineos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipoSangue && (
                <p className="text-red-500 text-sm mt-1">{errors.tipoSangue.message}</p>
              )}
            </div>
          </div>

          {/* Requisitos oficiais */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-3">
              Requisitos Oficiais para Doação de Sangue
            </h3>
            <ul className="text-sm text-red-700 space-y-2">
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Ter idade entre <strong>18 e 65 anos</strong></span>
              </li>
              <li className="flex gap-2">
                <Scale className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Pesar no mínimo <strong>50 kg</strong></span>
              </li>
              <li className="flex gap-2">
                <Dumbbell className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Estar em <strong>boas condições de saúde</strong></span>
              </li>
              <li className="flex gap-2">
                <Moon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Ter dormido pelo menos <strong>7 horas</strong> na noite anterior</span>
              </li>
              <li className="flex gap-2">
                <Utensils className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Fazer refeição leve antes de doar (evitar alimentos gordurosos nas <strong>4 horas anteriores</strong>)</span>
              </li>
              <li className="flex gap-2">
                <IdCard className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Apresentar <strong>documento de identificação com fotografia</strong></span>
              </li>
              <li className="flex gap-2 flex-col mt-1">
                <span className="font-medium flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Intervalo entre doações:</span>
                <div className="pl-6 space-y-1">
                  <div className="flex items-center gap-1"><User className="w-4 h-4" /><span>Homens: a cada <strong>3 meses</strong></span></div>
                  <div className="flex items-center gap-1"><User className="w-4 h-4" /><span>Mulheres: a cada <strong>4 meses</strong></span></div>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel ? onCancel : () => window.history.back()} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};
