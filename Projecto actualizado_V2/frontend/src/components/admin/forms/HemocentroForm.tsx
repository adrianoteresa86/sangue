import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

const HORARIOS_FUNCIONAMENTO = [
  { value: '', label: 'Selecionar horário' },
  { value: 'Seg a Sex: 7h às 15h', label: 'Seg a Sex: 7h às 15h' },
  { value: 'Seg a Sex: 8h às 16h', label: 'Seg a Sex: 8h às 16h' },
  { value: 'Seg a Sex: 8h às 17h', label: 'Seg a Sex: 8h às 17h' },
  { value: 'Seg a Sáb: 8h às 14h', label: 'Seg a Sáb: 8h às 14h' },
  { value: 'Seg a Sáb: 8h às 16h', label: 'Seg a Sáb: 8h às 16h' },
  { value: 'Seg a Sáb: 8h às 12h | Dom: Encerrado', label: 'Seg a Sáb: 8h às 12h | Dom: Encerrado' },
  { value: 'Seg a Dom: 8h às 16h', label: 'Seg a Dom: 8h às 16h' },
  { value: '24 horas / 7 dias', label: '24 horas / 7 dias' },
];

const hemocentroSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(150, 'Máximo 150 caracteres'),
  endereco: z.string().max(255, 'Máximo 255 caracteres').optional(),
  cidade: z.string().max(100, 'Máximo 100 caracteres').optional(),
  estado: z.string().max(100, 'Máximo 100 caracteres').optional(),
  telefone: z.string().max(30, 'Máximo 30 caracteres').optional(),
  email: z.string().email('Email inválido').max(150, 'Máximo 150 caracteres').optional(),
  horarioFuncionamento: z.string().max(100, 'Máximo 100 caracteres').optional(),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  ativo: z.boolean(),
});

type HemocentroFormData = z.infer<typeof hemocentroSchema>;

interface HemocentroFormProps {
  onSubmit: (data: HemocentroFormData) => void;
  initialData?: Partial<HemocentroFormData>;
  loading?: boolean;
  title: string;
  onCancel?: () => void;
}

export const HemocentroForm: React.FC<HemocentroFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  title,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HemocentroFormData>({
    resolver: zodResolver(hemocentroSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      endereco: initialData?.endereco || '',
      cidade: initialData?.cidade || '',
      estado: initialData?.estado || '',
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      horarioFuncionamento: initialData?.horarioFuncionamento || '',
      descricao: initialData?.descricao || '',
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
      ativo: initialData?.ativo ?? true,
    },
  });

  useEffect(() => {
    reset({
      nome: initialData?.nome || '',
      endereco: initialData?.endereco || '',
      cidade: initialData?.cidade || '',
      estado: initialData?.estado || '',
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      horarioFuncionamento: initialData?.horarioFuncionamento || '',
      descricao: initialData?.descricao || '',
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
      ativo: initialData?.ativo ?? true,
    });
  }, [initialData, reset]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome do Hemocentro"
              placeholder="Nome completo"
              {...register('nome')}
              error={errors.nome?.message}
              className="md:col-span-2"
            />

            <Input
              label="Endereço"
              placeholder="Rua, número, bairro"
              {...register('endereco')}
              error={errors.endereco?.message}
              className="md:col-span-2"
            />

            <Input
              label="Cidade"
              placeholder="Cidade"
              {...register('cidade')}
              error={errors.cidade?.message}
            />

            <Input
              label="Estado"
              placeholder="Estado"
              {...register('estado')}
              error={errors.estado?.message}
            />

            <Input
              label="Telefone"
              placeholder="+244 123 456 789"
              {...register('telefone')}
              error={errors.telefone?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@exemplo.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Select
              label="Horário de Funcionamento"
              options={HORARIOS_FUNCIONAMENTO}
              {...register('horarioFuncionamento')}
              error={errors.horarioFuncionamento?.message}
            />

            <Input
              label="Latitude"
              type="number"
              step="any"
              placeholder="-8.838333"
              {...register('latitude', { valueAsNumber: true })}
              error={errors.latitude?.message}
            />

            <Input
              label="Longitude"
              type="number"
              step="any"
              placeholder="13.239444"
              {...register('longitude', { valueAsNumber: true })}
              error={errors.longitude?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              {...register('descricao')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Descrição do hemocentro, serviços oferecidos, etc."
            />
            {errors.descricao && (
              <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              {...register('ativo')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
              Hemocentro ativo
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
