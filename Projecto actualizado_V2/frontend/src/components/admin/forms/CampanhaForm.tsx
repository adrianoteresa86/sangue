import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { DateInput } from '../../common/DateInput';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { AlertTriangle } from 'lucide-react';

const campanhaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().optional(),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  tipoSanguineo: z.string().max(100, 'Máximo 100 caracteres').optional(),
  metaDoacoes: z.number().min(1, 'Meta deve ser maior que 0').max(500, 'Meta máxima é 500 doações'),
  doacoesAtuais: z.number().min(0, 'Doações atuais não podem ser negativas').max(500, 'Máximo de doações é 500'),
  hemocentroId: z.number().min(1, 'Hemocentro é obrigatório'),
  ativo: z.boolean(),
}).refine((data) => data.doacoesAtuais <= data.metaDoacoes, {
  message: 'Doações atuais não podem exceder a meta de doações',
  path: ['doacoesAtuais'],
}).refine((data) => data.metaDoacoes >= data.doacoesAtuais, {
  message: 'Meta de doações não pode ser menor que as doações atuais',
  path: ['metaDoacoes'],
});

type CampanhaFormData = z.infer<typeof campanhaSchema>;

interface CampanhaFormProps {
  onSubmit: (data: CampanhaFormData) => void;
  initialData?: Partial<CampanhaFormData>;
  loading?: boolean;
  title: string;
  hemocentros?: Array<{ id: number; nome: string }>;
  onCancel?: () => void;
}

export const CampanhaForm: React.FC<CampanhaFormProps> = ({
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
    watch,
  } = useForm<CampanhaFormData>({
    resolver: zodResolver(campanhaSchema),
    defaultValues: {
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      dataInicio: initialData?.dataInicio || '',
      dataFim: initialData?.dataFim || '',
      tipoSanguineo: initialData?.tipoSanguineo || '',
      metaDoacoes: initialData?.metaDoacoes || 0,
      doacoesAtuais: initialData?.doacoesAtuais || 0,
      hemocentroId: initialData?.hemocentroId || 0,
      ativo: initialData?.ativo ?? true,
    },
  });

  useEffect(() => {
    reset({
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      dataInicio: initialData?.dataInicio || '',
      dataFim: initialData?.dataFim || '',
      tipoSanguineo: initialData?.tipoSanguineo || '',
      metaDoacoes: initialData?.metaDoacoes || 0,
      doacoesAtuais: initialData?.doacoesAtuais || 0,
      hemocentroId: initialData?.hemocentroId || 0,
      ativo: initialData?.ativo ?? true,
    });
  }, [initialData, reset]);

  const tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Título da Campanha"
              placeholder="Digite o título"
              {...register('titulo')}
              error={errors.titulo?.message}
              className="md:col-span-2"
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                {...register('descricao')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descreva a campanha, objetivo, público-alvo, etc."
              />
              {errors.descricao && (
                <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
              )}
            </div>

            <DateInput
              label="Data de Início"
              {...register('dataInicio')}
              error={errors.dataInicio?.message}
            />

            <DateInput
              label="Data de Fim"
              {...register('dataFim')}
              error={errors.dataFim?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Sanguíneo Alvo
              </label>
              <select
                {...register('tipoSanguineo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione (opcional)</option>
                {tiposSanguineos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipoSanguineo && (
                <p className="text-red-500 text-sm mt-1">{errors.tipoSanguineo.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta de Doações
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="100"
                  {...register('metaDoacoes', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.metaDoacoes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.metaDoacoes && (
                  <p className="text-red-500 text-sm mt-1">{errors.metaDoacoes.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doações Atuais
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  placeholder="0"
                  {...register('doacoesAtuais', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.doacoesAtuais ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.doacoesAtuais && (
                  <p className="text-red-500 text-sm mt-1">{errors.doacoesAtuais.message}</p>
                )}
              </div>
            </div>

            {/* Progresso Visual */}
            <div className="md:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progresso Atual</span>
                  <span className={`font-semibold ${
                    (watch('doacoesAtuais') || 0) > (watch('metaDoacoes') || 0) ? 'text-primary-intense' : 'text-green-600'
                  }`}>
                    {watch('doacoesAtuais') || 0} / {watch('metaDoacoes') || 0}
                    {watch('metaDoacoes') && watch('metaDoacoes') > 0 && (
                      <span className="ml-2">
                        ({Math.round(((watch('doacoesAtuais') || 0) / watch('metaDoacoes')) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (watch('doacoesAtuais') || 0) > (watch('metaDoacoes') || 0) 
                        ? 'bg-red-500' 
                        : (watch('doacoesAtuais') || 0) === (watch('metaDoacoes') || 0)
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${Math.min(((watch('doacoesAtuais') || 0) / Math.max(watch('metaDoacoes') || 1, 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                {(watch('doacoesAtuais') || 0) > (watch('metaDoacoes') || 0) && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Doações atuais excedem a meta definida
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hemocentro Responsável
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
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              {...register('ativo')}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
              Campanha ativa
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
