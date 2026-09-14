import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ClipboardList, Droplets, CheckCircle, XCircle, CalendarDays, Info, RefreshCw, Megaphone, Bell, MessageCircle, Plus } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { MensagemForm, type MensagemFormData } from '../../components/admin/forms/MensagemForm';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadoEm: string;
  lidaEm?: string;
  destinatario?: {
    id: number;
    nome: string;
    email: string;
  };
  remetente?: {
    id: number;
    nome: string;
    email: string;
  };
}

interface TipoConfig {
  icon: React.ReactNode;
  accent: string;
  bgNaoLida: string;
  iconBg: string;
}

const ICON_CLASS = 'w-5 h-5';

const TIPO_CONFIG: Record<string, TipoConfig> = {
  ADMIN_NOTIFICATION:    { icon: <ClipboardList className={ICON_CLASS} />, accent: '#6366f1', bgNaoLida: '#eef2ff', iconBg: '#e0e7ff' },
  DONATION_REMINDER:     { icon: <Droplets className={ICON_CLASS} />, accent: '#f87171', bgNaoLida: '#fff1f2', iconBg: '#fee2e2' },
  DONATION_CONFIRMED:    { icon: <CheckCircle className={ICON_CLASS} />, accent: '#4ade80', bgNaoLida: '#f0fdf4', iconBg: '#dcfce7' },
  DONATION_CANCELLED:    { icon: <XCircle className={ICON_CLASS} />, accent: '#fb923c', bgNaoLida: '#fff7ed', iconBg: '#ffedd5' },
  APPOINTMENT_SCHEDULED: { icon: <CalendarDays className={ICON_CLASS} />, accent: '#60a5fa', bgNaoLida: '#eff6ff', iconBg: '#dbeafe' },
  SYSTEM_ALERT:          { icon: <Info className={ICON_CLASS} />, accent: '#94a3b8', bgNaoLida: '#f8fafc', iconBg: '#f1f5f9' },
  TRANSFUSION_REQUEST:   { icon: <RefreshCw className={ICON_CLASS} />, accent: '#c084fc', bgNaoLida: '#faf5ff', iconBg: '#f3e8ff' },
  CAMPAIGN_ANNOUNCEMENT: { icon: <Megaphone className={ICON_CLASS} />, accent: '#facc15', bgNaoLida: '#fefce8', iconBg: '#fef9c3' },
  MESSAGE:               { icon: <MessageCircle className={ICON_CLASS} />, accent: '#10b981', bgNaoLida: '#ecfdf5', iconBg: '#d1fae5' },
};

const DEFAULT_CONFIG: TipoConfig = {
  icon: <Bell className={ICON_CLASS} />, accent: '#9ca3af', bgNaoLida: '#f9fafb', iconBg: '#f3f4f6',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export const AdminNotificacoes: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'minhas' | 'sistema'>('minhas');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: notificacoes = [], isLoading, isError } = useQuery<Notificacao[]>({
    queryKey: ['admin-notificacoes', activeTab],
    queryFn: () => activeTab === 'minhas' 
      ? api.get('/notificacoes/minhas').then((r) => r.data)
      : api.get('/notificacoes').then((r) => r.data),
  });

  const lerUmaMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notificacoes/${id}/lida`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes-count'] });
      toast.success(t('admin.notificacoes.toast_marked'));
    },
    onError: () => toast.error(t('admin.notificacoes.toast_error')),
  });

  const lerTodasMutation = useMutation({
    mutationFn: () => api.patch('/notificacoes/minhas/marcar-todas-lidas'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes-count'] });
      toast.success(t('admin.notificacoes.toast_all_marked'));
    },
    onError: () => toast.error(t('admin.notificacoes.toast_error_all')),
  });

  const enviarMensagemMutation = useMutation({
    mutationFn: (data: MensagemFormData) => api.post('/notificacoes/enviar-mensagem', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
      toast.success('Mensagem enviada com sucesso');
      setIsMessageModalOpen(false);
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const responderMutation = useMutation({
    mutationFn: ({ id, resposta }: { id: number, resposta: string }) => api.post(`/notificacoes/resposta/${id}`, { resposta }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes'] });
      toast.success('Resposta enviada com sucesso');
      setReplyingTo(null);
      setReplyText('');
    },
    onError: () => toast.error('Erro ao enviar resposta'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        {t('admin.notificacoes.error_load')}
      </div>
    );
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.notificacoes.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {activeTab === 'minhas' && naoLidas > 0 ? (
              <span className="text-primary font-semibold">
                {naoLidas !== 1
                  ? t('admin.notificacoes.unread_plural', { count: naoLidas })
                  : t('admin.notificacoes.unread_single', { count: naoLidas })}
              </span>
            ) : (
              activeTab === 'minhas' ? t('admin.notificacoes.all_read') : 'Todas as notificações geradas pelo sistema'
            )}
            {' '}{t('admin.notificacoes.total', { count: notificacoes.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'minhas' && naoLidas > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => lerTodasMutation.mutate()}
              loading={lerTodasMutation.isPending}
            >
              {t('admin.notificacoes.mark_all_read')}
            </Button>
          )}
          <Button onClick={() => setIsMessageModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full max-w-md">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'minhas' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('minhas')}
        >
          Minha Caixa de Entrada
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'sistema' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('sistema')}
        >
          Todas do Sistema
        </button>
      </div>

      <Card>
        {notificacoes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">{t('admin.notificacoes.empty_msg')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notificacoes.map((n) => {
              const cfg = TIPO_CONFIG[n.tipo] ?? DEFAULT_CONFIG;
              const isMine = activeTab === 'minhas';
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-4 p-4 transition-colors flex-col sm:flex-row"
                  style={{
                    backgroundColor: isMine && n.lida ? '#ffffff' : (isMine ? cfg.bgNaoLida : '#ffffff'),
                    borderLeft: `4px solid ${isMine && n.lida ? 'transparent' : cfg.accent}`,
                  }}
                >
                  <div className="flex flex-1 items-start gap-4 w-full">
                    <div
                      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cfg.iconBg, color: cfg.accent }}
                    >
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${isMine && n.lida ? 'text-gray-500' : 'text-gray-900'}`}>
                          {n.titulo}
                          {isMine && !n.lida && (
                            <span
                              className="ml-2 inline-block w-2 h-2 rounded-full align-middle"
                              style={{ backgroundColor: cfg.accent }}
                            />
                          )}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                          {formatDate(n.criadoEm)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isMine && n.lida ? 'text-gray-400' : 'text-gray-600'}`}>{n.mensagem}</p>
                      
                      {n.remetente && (
                        <p className="text-xs text-gray-500 mt-2 font-medium">De: {n.remetente.nome} ({n.remetente.email})</p>
                      )}
                      {activeTab === 'sistema' && n.destinatario && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">Para: {n.destinatario.nome} ({n.destinatario.email})</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 sm:items-end w-full sm:w-auto mt-4 sm:mt-0 pl-14 sm:pl-0">
                    {isMine && !n.lida && (
                      <button
                        onClick={() => lerUmaMutation.mutate(n.id)}
                        disabled={lerUmaMutation.isPending}
                        className="text-xs text-primary hover:underline disabled:opacity-50 text-left sm:text-right"
                      >
                        {t('admin.notificacoes.mark_read')}
                      </button>
                    )}
                    {isMine && n.remetente && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === n.id ? null : n.id)}
                        className="text-xs text-primary hover:underline font-medium text-left sm:text-right"
                      >
                        {replyingTo === n.id ? 'Cancelar Resposta' : 'Responder'}
                      </button>
                    )}
                  </div>
                  
                  {replyingTo === n.id && (
                    <div className="w-full pl-14 sm:pl-0 mt-4 sm:mt-2">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={2}
                        placeholder="Escreva a sua resposta..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          size="sm" 
                          disabled={!replyText.trim() || responderMutation.isPending}
                          loading={responderMutation.isPending}
                          onClick={() => responderMutation.mutate({ id: n.id, resposta: replyText })}
                        >
                          Enviar Resposta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} title="Nova Mensagem">
        <MensagemForm 
          onSubmit={(data) => enviarMensagemMutation.mutate(data)}
          onCancel={() => setIsMessageModalOpen(false)}
          isLoading={enviarMensagemMutation.isPending}
        />
      </Modal>
    </div>
  );
};
