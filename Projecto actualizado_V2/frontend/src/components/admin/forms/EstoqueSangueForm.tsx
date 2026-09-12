import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { DateInput } from '../../common/DateInput';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

const estoqueSangueSchema = z.object({
  hemocentroId: z.number().min(1, 'Hemocentro é obrigatório'),
  tipoSangue: z.string().min(1, 'Tipo sanguíneo é obrigatório').max(5, 'Máximo 5 caracteres'),
  quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
  tipoComponente: z.string().min(1, 'Tipo de componente é obrigatório'),
  dataValidade: z.string().min(1, 'Data de validade é obrigatória'),
  dataRecebimento: z.string().min(1, 'Data de recebimento é obrigatória'),
  disponivel: z.boolean(),
});

type EstoqueSangueFormData = z.infer<typeof estoqueSangueSchema>;

interface EstoqueSangueFormProps {
  onSubmit: (data: EstoqueSangueFormData) => void;
  initialData?: Partial<EstoqueSangueFormData>;
  loading?: boolean;
  title: string;
  hemocentros?: Array<{ id: number; nome: string }>;
  onCancel?: () => void;
}

export const EstoqueSangueForm: React.FC<EstoqueSangueFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  title,
  hemocentros = [],
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstoqueSangueFormData>({
    resolver: zodResolver(estoqueSangueSchema),
    defaultValues: {
      hemocentroId: initialData?.hemocentroId || 0,
      tipoSangue: initialData?.tipoSangue || '',
      quantidade: initialData?.quantidade || 0,
      tipoComponente: initialData?.tipoComponente || '',
      dataValidade: initialData?.dataValidade || '',
      dataRecebimento: initialData?.dataRecebimento || '',
      disponivel: initialData?.disponivel ?? true,
    },
  });

  useEffect(() => {
    reset({
      hemocentroId: initialData?.hemocentroId || 0,
      tipoSangue: initialData?.tipoSangue || '',
      quantidade: initialData?.quantidade || 0,
      tipoComponente: initialData?.tipoComponente || '',
      dataValidade: initialData?.dataValidade || '',
      dataRecebimento: initialData?.dataRecebimento || '',
      disponivel: initialData?.disponivel ?? true,
    });
  }, [initialData, reset]);

  const tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const tiposComponentes = [
    'Sangue Total',
    'Concentrado de Hemácias',
    'Plaquetas',
    'Plasma Fresco Congelado',
    'Crio precipitado',
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hemocentro
              </label>
              <select
                {...register('hemocentroId', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="0">Selecione um hemocentro</option>
                {hemocentros.map((hemocentro) => (
                  <option key={hemocentro.id} value={hemocentro.id}>
                    {hemocentro.nome}
                  </option>
                ))}
              </select>
              {errors.hemocentroId && (
                <p className="text-red-500 text-sm mt-1">{errors.hemocentroId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Sanguíneo
              </label>
              <select
                {...register('tipoSangue')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione</option>
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

            <Input
              label="Quantidade (ml)"
              type="number"
              min="1"
              placeholder="450"
              {...register('quantidade', { valueAsNumber: true })}
              error={errors.quantidade?.message}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Componente
              </label>
              <select
                {...register('tipoComponente')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione</option>
                {tiposComponentes.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipoComponente && (
                <p className="text-red-500 text-sm mt-1">{errors.tipoComponente.message}</p>
              )}
            </div>

            <DateInput
              label="Data de Validade"
              {...register('dataValidade')}
              error={errors.dataValidade?.message}
            />

            <DateInput
              label="Data de Recebimento"
              {...register('dataRecebimento')}
              error={errors.dataRecebimento?.message}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="disponivel"
              {...register('disponivel')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="disponivel" className="ml-2 text-sm text-gray-700">
              Disponível para uso
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
