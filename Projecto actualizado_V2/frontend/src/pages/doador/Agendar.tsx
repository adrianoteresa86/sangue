import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { DateInput } from '../../components/common/DateInput';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ClipboardList, Clock, Calendar, FlaskConical, Scale, Dumbbell, Moon, Utensils, IdCard, User } from 'lucide-react';
import api from '../../services/api';

const hoje = new Date().toISOString().split('T')[0];

export const DoadorAgendar: React.FC = () => {
  const { t } = useTranslation();
  const [etapa, setEtapa] = useState<'declaracao' | 'formulario'>('declaracao');
  const [declaracoes, setDeclaracoes] = useState<Record<string, boolean>>({
    saude: false,
    sono: false,
    refeicao: false,
    documento: false,
  });

  const [formData, setFormData] = useState({
    hemocentro: '',
    data: '',
    hora: '',
    tipoSangue: '',
    observacoes: '',
  });

  const queryClient = useQueryClient();

  const DECLARACOES = [
    { id: 'saude', label: t('doador.agendar.decl_health') },
    { id: 'sono', label: t('doador.agendar.decl_sleep') },
    { id: 'refeicao', label: t('doador.agendar.decl_meal') },
    { id: 'documento', label: t('doador.agendar.decl_id') },
  ];

  const { data: me } = useQuery<any>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data),
  });

  const { data: meusAgendamentos = [] } = useQuery<any[]>({
    queryKey: ['meus-agendamentos'],
    queryFn: () => api.get('/agendamentos-doacao/meus').then((r) => r.data),
  });

  // Agendamento activo (bloqueia novo pedido)
  const agendamentoAtivo = meusAgendamentos.find(
    (a) => a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'IN_PROCESSING' || a.status === 'RESCHEDULE_REQUESTED',
  );

  // Último concluído — verificar intervalo por género
  const ultimoConcluido = meusAgendamentos
    .filter((a) => a.status === 'COMPLETED')
    .sort((a: any, b: any) => new Date(b.dataPreferida).getTime() - new Date(a.dataPreferida).getTime())[0];

  const genero = me?.perfilDoador?.genero as string | undefined;
  const mesesIntervalo = genero === 'FEMININO' ? 3 : 4;

  let proximaDataDisponivel: Date | null = null;
  if (ultimoConcluido && !agendamentoAtivo) {
    const proxima = new Date(ultimoConcluido.dataPreferida);
    proxima.setMonth(proxima.getMonth() + mesesIntervalo);
    if (proxima > new Date()) proximaDataDisponivel = proxima;
  }

  const bloqueado = !!agendamentoAtivo || !!proximaDataDisponivel;

  const { data: hemocentrosData, isLoading: loadingHemocentros } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const hemocentros = (hemocentrosData as { id: number; nome: string; cidade?: string }[] | undefined)?.map((h) => ({
    value: h.id.toString(),
    label: `${h.nome} - ${h.cidade || ''}`,
  })) || [];

  const horarios = [
    { value: '08:00', label: '08:00 - 09:00' },
    { value: '09:00', label: '09:00 - 10:00' },
    { value: '10:00', label: '10:00 - 11:00' },
    { value: '14:00', label: '14:00 - 15:00' },
    { value: '15:00', label: '15:00 - 16:00' },
  ];

  const todasDeclaradas = Object.values(declaracoes).every(Boolean);

  const handleDeclaracao = (id: string) => {
    setDeclaracoes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    mutate();
  };

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async () => {
      if (!formData.hemocentro || !formData.data || !formData.hora) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      const dateISO = `${formData.data}T${formData.hora}:00`;
      const dateTime = new Date(dateISO);

      if (isNaN(dateTime.getTime())) {
        throw new Error(`Data ou hora inválida.`);
      }

      const appointmentData = {
        idHemocentro: parseInt(formData.hemocentro),
        dataPreferida: dateTime.toISOString(),
        horaPreferida: formData.hora,
        tipoSangue: formData.tipoSangue?.trim() || undefined,
        observacoes: formData.observacoes || null,
      };

      const response = await api.post('/agendamentos-doacao', appointmentData);
      return response.data;
    },
    onSuccess: () => {
      setFormData({ hemocentro: '', data: '', hora: '', tipoSangue: '', observacoes: '' });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-doacao'] });
      queryClient.invalidateQueries({ queryKey: ['doador-historico'] });
      toast.success(t('doador.agendar.success_title'));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.erro ||
        err?.response?.data?.message ||
        err?.message ||
        t('doador.agendar.error_retry');
      toast.error(msg, { duration: 6000 });
    },
  });

  // Etapa 1 — Declaração pré-doação
  if (etapa === 'declaracao') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('doador.agendar.title')}</h1>
          <p className="text-gray-600">{t('doador.agendar.subtitle')}</p>
        </div>

        {/* Regras oficiais */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('doador.agendar.requirements_title')}</h2>
                <p className="text-sm text-gray-500">{t('doador.agendar.requirements_subtitle')}</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{t('doador.agendar.req_age')}</span>
                  <span className="text-sm font-bold text-red-700">{t('doador.agendar.req_age_range')}</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Scale className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{t('doador.agendar.req_weight')}</span>
                  <span className="text-sm font-bold text-red-700">{t('doador.agendar.req_weight_value')}</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Dumbbell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: t('doador.agendar.req_health') }} />
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Moon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{t('doador.agendar.req_sleep')}</span>
                  <span className="text-sm font-bold text-red-700">{t('doador.agendar.req_sleep_hours')}</span>
                  <span className="text-sm font-medium text-gray-900">{t('doador.agendar.req_sleep_suffix')}</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Utensils className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: t('doador.agendar.req_food') }} />
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <IdCard className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: t('doador.agendar.req_id') }} />
              </li>
              <li className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm font-medium text-gray-900">
                  <p className="font-semibold mb-1">{t('doador.agendar.req_interval_title')}</p>
                  <p className="flex items-center gap-1"><User className="w-4 h-4 shrink-0" /><span dangerouslySetInnerHTML={{ __html: t('doador.agendar.req_men') }} /></p>
                  <p className="flex items-center gap-1"><User className="w-4 h-4 shrink-0" /><span dangerouslySetInnerHTML={{ __html: t('doador.agendar.req_women') }} /></p>
                </div>
              </li>
            </ul>
          </div>
        </Card>

        {/* Declarações obrigatórias */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('doador.agendar.declaration_title')}</h2>
            <p className="text-sm text-gray-500 mb-5">
              {t('doador.agendar.declaration_subtitle')}
            </p>

            <div className="space-y-3">
              {DECLARACOES.map((dec) => (
                <label
                  key={dec.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    declaracoes[dec.id]
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={declaracoes[dec.id]}
                    onChange={() => handleDeclaracao(dec.id)}
                    className="mt-0.5 w-4 h-4 text-green-600 rounded"
                  />
                  <span className={`text-sm font-medium ${declaracoes[dec.id] ? 'text-green-800' : 'text-gray-700'}`}>
                    {dec.label}
                  </span>
                </label>
              ))}
            </div>

            {!todasDeclaradas && (
              <div className="mt-4 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm">{t('doador.agendar.confirm_all')}</p>
              </div>
            )}

            {todasDeclaradas && (
              <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">{t('doador.agendar.all_confirmed')}</p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full mt-5"
              onClick={() => setEtapa('formulario')}
              disabled={!todasDeclaradas}
            >
              {t('doador.agendar.proceed_button')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Etapa 2 — Formulário de agendamento
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEtapa('declaracao')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {t('doador.agendar.back')}
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('doador.agendar.form_title')}</h1>
          <p className="text-gray-600">{t('doador.agendar.form_subtitle')}</p>
        </div>
      </div>

      {/* Declarações confirmadas */}
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <p className="text-sm font-medium">{t('doador.agendar.declaration_ok')}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Select
            label={t('doador.agendar.hemocentro_label')}
            name="hemocentro"
            value={formData.hemocentro}
            onChange={handleChange}
            options={
              loadingHemocentros
                ? [{ value: '', label: t('doador.agendar.hemocentro_loading') }]
                : [{ value: '', label: t('doador.agendar.hemocentro_placeholder') }, ...hemocentros]
            }
            disabled={loadingHemocentros}
            required
          />

          <DateInput
            label={t('doador.agendar.date_label')}
            name="data"
            value={formData.data}
            onChange={handleChange}
            min={hoje}
            required
          />

          <Select
            label={t('doador.agendar.time_label')}
            name="hora"
            value={formData.hora}
            onChange={handleChange}
            options={[{ value: '', label: t('doador.agendar.time_placeholder') }, ...horarios]}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('doador.agendar.blood_type_label')}
            </label>
            <select
              name="tipoSangue"
              value={formData.tipoSangue}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('doador.agendar.blood_type_placeholder')}</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('doador.agendar.notes_label')}
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder={t('doador.agendar.notes_placeholder')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-medium">{t('doador.agendar.success_title')}</p>
              <p className="text-sm mt-1">{t('doador.agendar.success_email')}</p>
            </div>
          )}

          {agendamentoAtivo && (() => {
            const STATUS_MSG: Record<string, { Icon: React.ElementType; titulo: string; cor: string; bg: string; borda: string }> = {
              PENDING:              { Icon: Clock,        titulo: 'Agendamento pendente de aprovação',    cor: 'text-amber-800',  bg: 'bg-amber-50',  borda: 'border-amber-200'  },
              APPROVED:             { Icon: Calendar,     titulo: 'Agendamento aprovado',                 cor: 'text-blue-800',   bg: 'bg-blue-50',   borda: 'border-blue-200'   },
              IN_PROCESSING:        { Icon: FlaskConical, titulo: 'Doação em processamento',              cor: 'text-purple-800', bg: 'bg-purple-50', borda: 'border-purple-200' },
              RESCHEDULE_REQUESTED: { Icon: Clock,        titulo: 'Pedido de reagendamento em análise',   cor: 'text-orange-800', bg: 'bg-orange-50', borda: 'border-orange-200' },
            };
            const cfg = STATUS_MSG[agendamentoAtivo.status];
            if (!cfg) return null;
            const { Icon, titulo, cor, bg, borda } = cfg;
            const dataFormatada = new Date(agendamentoAtivo.dataPreferida).toLocaleDateString('pt-PT');
            const hora = agendamentoAtivo.horaPreferida ? ` às ${agendamentoAtivo.horaPreferida}` : '';
            const hemocentro = agendamentoAtivo.hemocentro?.nome ?? '';
            return (
              <div className={`${bg} border ${borda} ${cor} px-4 py-3 rounded-lg`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 shrink-0" />
                  <p className="font-semibold text-sm">{titulo}</p>
                </div>
                <p className="text-sm">
                  {agendamentoAtivo.status === 'PENDING' && 'O seu pedido está a aguardar aprovação do hemocentro.'}
                  {agendamentoAtivo.status === 'APPROVED' && `Dirija-se a ${hemocentro} em ${dataFormatada}${hora}.`}
                  {agendamentoAtivo.status === 'IN_PROCESSING' && 'O seu sangue está em análise laboratorial. Receberá uma notificação com o resultado.'}
                  {agendamentoAtivo.status === 'RESCHEDULE_REQUESTED' && 'O seu pedido de reagendamento foi enviado e aguarda análise pelo administrador.'}
                </p>
                {hemocentro && (agendamentoAtivo.status === 'PENDING' || agendamentoAtivo.status === 'RESCHEDULE_REQUESTED') && (
                  <p className="text-xs mt-1 opacity-75">{hemocentro} · {dataFormatada}{hora}</p>
                )}
              </div>
            );
          })()}

          {proximaDataDisponivel && !agendamentoAtivo && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 shrink-0" />
                <p className="font-semibold text-sm">Intervalo mínimo não atingido</p>
              </div>
              <p className="text-sm">
                {genero === 'FEMININO'
                  ? `Para mulheres, o intervalo mínimo entre doações é de ${mesesIntervalo} meses.`
                  : `Para homens, o intervalo mínimo entre doações é de ${mesesIntervalo} meses.`}
              </p>
              <p className="text-sm font-medium mt-1">
                Próxima doação disponível: {proximaDataDisponivel.toLocaleDateString('pt-PT')}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            className="w-full"
            disabled={loadingHemocentros || isPending || bloqueado}
          >
            {isPending ? t('doador.agendar.processing') : t('doador.agendar.confirm_button')}
          </Button>
        </form>
      </Card>
    </div>
  );
};
