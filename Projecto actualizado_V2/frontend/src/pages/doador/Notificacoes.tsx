import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, Clock, Droplets, FlaskConical, Megaphone, AlertTriangle, Calendar, Activity, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadoEm: string;
  lidaEm?: string;
}

function formatRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Agora mesmo';
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Há ${d} dia${d > 1 ? 's' : ''}`;
  return new Date(iso).toLocaleDateString('pt-PT');
}

const TIPO_CFG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  DONATION_REMINDER:      { Icon: Clock,          bg: '#fef9c3', color: '#854d0e' },
  DONATION_CONFIRMED:     { Icon: Droplets,        bg: '#dcfce7', color: '#166534' },
  DONATION_CANCELLED:     { Icon: XCircle,         bg: '#fee2e2', color: '#991b1b' },
  DONATION_REFUSED:       { Icon: XCircle,         bg: '#fee2e2', color: '#991b1b' },
  TRIAGE_IN_PROCESSING:   { Icon: FlaskConical,    bg: '#ede9fe', color: '#5b21b6' },
  CAMPAIGN_ANNOUNCEMENT:  { Icon: Megaphone,       bg: '#dbeafe', color: '#1d4ed8' },
  BLOOD_URGENCY:          { Icon: AlertTriangle,   bg: '#fff7ed', color: '#c2410c' },
  APPOINTMENT_SCHEDULED:  { Icon: Calendar,        bg: '#f0fdf4', color: '#16a34a' },
  TEST_RESULTS_READY:     { Icon: Activity,        bg: '#fdf4ff', color: '#7e22ce' },
  SYSTEM_ALERT:           { Icon: AlertTriangle,   bg: '#f1f5f9', color: '#475569' },
};

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'nao-lidas', label: 'Não lidas' },
  { value: 'lidas', label: 'Lidas' },
];

export const DoadorNotificacoes: React.FC = () => {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState('todas');

  const { data: notificacoes = [], isLoading } = useQuery<Notificacao[]>({
    queryKey: ['minhas-notificacoes'],
    queryFn: () => api.get('/notificacoes/minhas').then((r) => r.data),
  });

  const marcarLidaMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notificacoes/${id}/lida`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes-count'] });
    },
  });

  const marcarTodasMutation = useMutation({
    mutationFn: () => api.patch('/notificacoes/minhas/marcar-todas-lidas'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes-count'] });
      toast.success('Todas as notificações marcadas como lidas.');
    },
  });

  const lista = notificacoes.filter((n) => {
    if (filtro === 'nao-lidas') return !n.lida;
    if (filtro === 'lidas') return n.lida;
    return true;
  });

  const totalNaoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <p className="text-sm text-gray-500">
              {totalNaoLidas > 0 ? `${totalNaoLidas} não lida${totalNaoLidas > 1 ? 's' : ''}` : 'Tudo lido'}
            </p>
          </div>
        </div>

        {totalNaoLidas > 0 && (
          <button
            onClick={() => marcarTodasMutation.mutate()}
            disabled={marcarTodasMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f.value
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.value === 'nao-lidas' && totalNaoLidas > 0 && (
              <span className="ml-1.5 bg-white text-red-600 rounded-full px-1.5 py-0.5 text-xs font-bold">
                {totalNaoLidas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-20">
          <BellOff className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma notificação</p>
          <p className="text-gray-400 text-sm mt-1">
            {filtro === 'nao-lidas' ? 'Está tudo em dia!' : 'As suas notificações aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((n) => {
            const tipoCfg = TIPO_CFG[n.tipo] ?? { Icon: Bell, bg: '#f1f5f9', color: '#475569' };
            const { Icon, bg, color } = tipoCfg;

            return (
              <div
                key={n.id}
                onClick={() => !n.lida && marcarLidaMutation.mutate(n.id)}
                className={`flex gap-4 p-4 rounded-xl border transition-all ${
                  n.lida
                    ? 'bg-white border-gray-100 opacity-70'
                    : 'bg-white border-gray-200 shadow-sm cursor-pointer hover:shadow-md'
                }`}
              >
                {/* Ícone */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-tight ${n.lida ? 'text-gray-600' : 'text-gray-900'}`}>
                      {n.titulo}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{formatRelativo(n.criadoEm)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.mensagem}</p>
                </div>

                {/* Indicador não lida */}
                {!n.lida && (
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
