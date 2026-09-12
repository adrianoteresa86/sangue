import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';

const pedidoTransfusaoSchema = z.object({
  idHemocentro: z.number().min(1, 'Selecione um hemocentro'),
  nomePaciente: z.string().min(1, 'Nome do paciente é obrigatório'),
  tipoSanguineoPaciente: z.string().min(1, 'Selecione o tipo sanguíneo'),
  idadePaciente: z.number().min(0, 'Idade inválida'),
  generoPaciente: z.string().min(1, 'Selecione o gênero'),
  numeroProntuario: z.string().min(1, 'Número do prontuário é obrigatório'),
  diagnostico: z.string().min(1, 'Diagnóstico é obrigatório'),
  tipoComponente: z.string().min(1, 'Selecione o tipo de componente'),
  quantidadeSolicitada: z.number().min(1, 'Quantidade deve ser maior que 0'),
  nivelUrgencia: z.number().min(1).max(5, 'Nível de urgência deve ser entre 1 e 5'),
  precisaAte: z.string().min(1, 'Data/hora é obrigatória'),
  indicacaoClinica: z.string().optional(),
  idReceptor: z.number().optional(),
  contatoMedico: z.string().optional(),
  observacoes: z.string().optional(),
});

type PedidoTransfusaoFormData = z.infer<typeof pedidoTransfusaoSchema>;

interface PedidoTransfusaoFormProps {
  title: string;
  onSubmit: (data: PedidoTransfusaoFormData) => void;
  initialData?: any;
  loading?: boolean;
  hemocentros: any[];
}

export const PedidoTransfusaoForm: React.FC<PedidoTransfusaoFormProps> = ({
  title,
  onSubmit,
  initialData,
  loading = false,
  hemocentros
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PedidoTransfusaoFormData>({
    resolver: zodResolver(pedidoTransfusaoSchema),
    defaultValues: initialData || {
      idHemocentro: 0,
      nomePaciente: '',
      tipoSanguineoPaciente: '',
      idadePaciente: 0,
      generoPaciente: 'Masculino',
      numeroProntuario: '',
      diagnostico: '',
      tipoComponente: '',
      quantidadeSolicitada: 0,
      nivelUrgencia: 1,
      precisaAte: '',
      indicacaoClinica: '',
      idReceptor: undefined,
      contatoMedico: '',
      observacoes: ''
    },
  });

  const tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const tiposComponentes = [
    'Sangue Total',
    'Concentrado de Hemácias',
    'Plasma',
    'Plaquetas',
    'Plasma Fresco Congelado',
    'Concentrado de Plaquetas'
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados do Paciente */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Dados do Paciente</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input
                type="text"
                {...register('nomePaciente')}
                placeholder="Nome do paciente"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo Sanguíneo</label>
              <select
                {...register('tipoSanguineoPaciente')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">Selecione...</option>
                {tiposSanguineos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Idade</label>
              <input
                type="number"
                {...register('idadePaciente', { valueAsNumber: true })}
                placeholder="Idade"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Gênero"
                {...register('generoPaciente')}
                error={errors.generoPaciente?.message}
              >
                <select {...register('generoPaciente')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </Input>

              <Input
                label="Número do Prontuário"
                placeholder="PR2024001234"
                {...register('numeroProntuario')}
                error={errors.numeroProntuario?.message}
              />
            </div>
          </div>

          {/* Dados da Transfusão */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Dados da Transfusão</h3>
            
            <Input
              label="Diagnóstico"
              placeholder="Diagnóstico médico"
              {...register('diagnostico')}
              error={errors.diagnostico?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tipo de Componente"
                {...register('tipoComponente')}
                error={errors.tipoComponente?.message}
              >
                <select {...register('tipoComponente')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                  <option value="">Selecione...</option>
                  {tiposComponentes.map(componente => (
                    <option key={componente} value={componente}>{componente}</option>
                  ))}
                </select>
              </Input>

              <Input
                label="Quantidade (mL)"
                type="number"
                placeholder="300"
                {...register('quantidadeSolicitada', { valueAsNumber: true })}
                error={errors.quantidadeSolicitada?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nível de Urgência"
                type="number"
                placeholder="1-5"
                {...register('nivelUrgencia', { valueAsNumber: true })}
                error={errors.nivelUrgencia?.message}
              >
                <div className="mt-1 text-xs text-gray-500">
                  1 = Baixa | 2 = Média | 3 = Alta | 4 = Crítica | 5 = Emergência
                </div>
              </Input>

              <Input
                label="Precisa Até"
                type="datetime-local"
                {...register('precisaAte')}
                error={errors.precisaAte?.message}
              />
            </div>

            <Input
              label="Indicação Clínica"
              placeholder="Ex: Cirurgia eletiva"
              {...register('indicacaoClinica')}
              error={errors.indicacaoClinica?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logística */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Logística</h3>
            
            <Input
              label="Hemocentro"
              {...register('idHemocentro', { valueAsNumber: true })}
              error={errors.idHemocentro?.message}
            >
              <select {...register('idHemocentro')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                <option value="">Selecione...</option>
                {hemocentros.map((hemocentro: any) => (
                  <option key={hemocentro.id} value={hemocentro.id}>
                    {hemocentro.nome}
                  </option>
                ))}
              </select>
            </Input>

            <Input
              label="Contato do Médico"
              placeholder="Dr. João Santos"
              {...register('contatoMedico')}
              error={errors.contatoMedico?.message}
            />
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informações Adicionais</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Observações</label>
              <textarea
                placeholder="Observações importantes sobre o pedido"
                {...register('observacoes')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset()}
          >
            Limpar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                Salvar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
