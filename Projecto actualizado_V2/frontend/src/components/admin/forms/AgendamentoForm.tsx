import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../common/Input';
import { DateInput } from '../../common/DateInput';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

const agendamentoSchema = z.object({
  usuarioId: z.number().min(1, 'Usuário é obrigatório'),
  hemocentroId: z.number().min(1, 'Hemocentro é obrigatório'),
  dataPreferida: z.string().min(1, 'Data preferida é obrigatória'),
  horaPreferida: z.string().max(10, 'Máximo 10 caracteres').optional(),
  tipoSangue: z.string().min(1, 'Tipo sanguíneo é obrigatório').max(5, 'Máximo 5 caracteres'),
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO']),
  observacoes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  nomeContatoEmergencia: z.string().max(200, 'Máximo 200 caracteres').optional(),
  telefoneContatoEmergencia: z.string().max(30, 'Máximo 30 caracteres').optional(),
  cidade: z.string().max(100, 'Máximo 100 caracteres').optional(),
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

interface AgendamentoFormProps {
  onSubmit: (data: AgendamentoFormData) => void;
  initialData?: Partial<AgendamentoFormData>;
  loading?: boolean;
  title: string;
  usuarios?: Array<{ id: number; nome: string; email: string }>;
  hemocentros?: Array<{ id: number; nome: string }>;
  onCancel?: () => void;
}

export const AgendamentoForm: React.FC<AgendamentoFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  title,
  usuarios = [],
  hemocentros = [],
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      usuarioId: initialData?.usuarioId || 0,
      hemocentroId: initialData?.hemocentroId || 0,
      dataPreferida: initialData?.dataPreferida || '',
      horaPreferida: initialData?.horaPreferida || '',
      tipoSangue: initialData?.tipoSangue || '',
      status: initialData?.status || 'PENDENTE',
      observacoes: initialData?.observacoes || '',
      nomeContatoEmergencia: initialData?.nomeContatoEmergencia || '',
      telefoneContatoEmergencia: initialData?.telefoneContatoEmergencia || '',
      cidade: initialData?.cidade || '',
    },
  });

  useEffect(() => {
    reset({
      usuarioId: initialData?.usuarioId || 0,
      hemocentroId: initialData?.hemocentroId || 0,
      dataPreferida: initialData?.dataPreferida || '',
      horaPreferida: initialData?.horaPreferida || '',
      tipoSangue: initialData?.tipoSangue || '',
      status: initialData?.status || 'PENDENTE',
      observacoes: initialData?.observacoes || '',
      nomeContatoEmergencia: initialData?.nomeContatoEmergencia || '',
      telefoneContatoEmergencia: initialData?.telefoneContatoEmergencia || '',
      cidade: initialData?.cidade || '',
    });
  }, [initialData, reset]);

  const tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'CONCLUIDO', label: 'Concluído' },
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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

            <div>
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

            <DateInput
              label="Data Preferida"
              {...register('dataPreferida')}
              error={errors.dataPreferida?.message}
            />

            <Input
              label="Hora Preferida"
              placeholder="14:30"
              {...register('horaPreferida')}
              error={errors.horaPreferida?.message}
            />

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>

            <Input
              label="Nome do Contato de Emergência"
              placeholder="Nome completo"
              {...register('nomeContatoEmergencia')}
              error={errors.nomeContatoEmergencia?.message}
            />

            <Input
              label="Telefone do Contato de Emergência"
              placeholder="+244 123 456 789"
              {...register('telefoneContatoEmergencia')}
              error={errors.telefoneContatoEmergencia?.message}
            />

            <Input
              label="Cidade"
              placeholder="Cidade"
              {...register('cidade')}
              error={errors.cidade?.message}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                {...register('observacoes')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Observações adicionais sobre o agendamento"
              />
              {errors.observacoes && (
                <p className="text-red-500 text-sm mt-1">{errors.observacoes.message}</p>
              )}
            </div>
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
