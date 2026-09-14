import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';

import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const mensagemSchema = z.object({
  tipoDestino: z.enum(['TODOS', 'HEMOCENTRO', 'USUARIO']),
  destinatarioId: z.string().optional(),
  titulo: z.string().min(3, 'O assunto deve ter pelo menos 3 caracteres'),
  mensagem: z.string().min(5, 'A mensagem deve ter pelo menos 5 caracteres'),
}).refine(data => {
  if (data.tipoDestino !== 'TODOS' && !data.destinatarioId) {
    return false;
  }
  return true;
}, {
  message: 'Selecione um destinatário',
  path: ['destinatarioId'],
});

export type MensagemFormData = z.infer<typeof mensagemSchema>;

interface MensagemFormProps {
  onSubmit: (data: MensagemFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const MensagemForm: React.FC<MensagemFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MensagemFormData>({
    resolver: zodResolver(mensagemSchema),
    defaultValues: {
      tipoDestino: 'TODOS',
      titulo: '',
      mensagem: '',
    }
  });

  const tipoDestino = watch('tipoDestino');

  const { data: hemocentros = [] } = useQuery({
    queryKey: ['hemocentros-list'],
    queryFn: () => api.get('/hemocentros').then(res => res.data.content || res.data),
    enabled: tipoDestino === 'HEMOCENTRO',
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-list'],
    queryFn: () => api.get('/usuarios?limite=1000').then(res => res.data.content || res.data),
    enabled: tipoDestino === 'USUARIO',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Para quem deseja enviar?</label>
        <select
          {...register('tipoDestino')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
        >
          <option value="TODOS">Todos os Utilizadores</option>
          <option value="HEMOCENTRO">Um Hemocentro Específico</option>
          <option value="USUARIO">Um Utilizador Específico</option>
        </select>
      </div>

      {tipoDestino === 'HEMOCENTRO' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Hemocentro</label>
          <select
            {...register('destinatarioId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          >
            <option value="">Selecione...</option>
            {hemocentros.map((h: any) => (
              <option key={h.id} value={h.id}>{h.nome}</option>
            ))}
          </select>
          {errors.destinatarioId && <span className="text-red-500 text-sm mt-1">{errors.destinatarioId.message}</span>}
        </div>
      )}

      {tipoDestino === 'USUARIO' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Utilizador</label>
          <select
            {...register('destinatarioId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          >
            <option value="">Selecione...</option>
            {usuarios.map((u: any) => (
              <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
            ))}
          </select>
          {errors.destinatarioId && <span className="text-red-500 text-sm mt-1">{errors.destinatarioId.message}</span>}
        </div>
      )}

      <Input
        label="Assunto"
        placeholder="Assunto da mensagem"
        error={errors.titulo?.message}
        {...register('titulo')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
        <textarea
          {...register('mensagem')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-none"
          placeholder="Escreva a sua mensagem aqui..."
        />
        {errors.mensagem && <span className="text-red-500 text-sm mt-1 block">{errors.mensagem.message}</span>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Enviar Mensagem
        </Button>
      </div>
    </form>
  );
};
