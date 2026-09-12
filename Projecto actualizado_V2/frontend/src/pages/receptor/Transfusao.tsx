import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, X, CheckCircle, Check } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import type { HemocentroSimples } from '../../types';

interface FormData {
  tipoSangue: string;
  volume: string;
  urgencia: string;
  motivo: string;
  observacoes: string;
  idHemocentro: string;
}

export const ReceptorTransfusao: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const inputFicheiroRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    tipoSangue: 'O-',
    volume: '',
    urgencia: 'normal',
    motivo: '',
    observacoes: '',
    idHemocentro: searchParams.get('hemocentro') ?? '',
  });

  const [documento, setDocumento] = useState<File | null>(null);
  const [urlDocumento, setUrlDocumento] = useState('');
  const [uploadando, setUploadando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const { data: hemocentros = [] } = useQuery<HemocentroSimples[]>({
    queryKey: ['hemocentros-lista'],
    queryFn: () => api.get('/hemocentros').then((r) => r.data?.hemocentros ?? r.data),
  });

  const criarMutation = useMutation({
    mutationFn: (dados: object) => api.post('/receptor/solicitar', dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['receptor-pedidos'] });
      setSucesso(true);
      toast.success(t('receptor.transfusao.success_title'));
      setTimeout(() => navigate('/receptor/requisicoes'), 1500);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.erro ?? t('common.error_load');
      setErro(msg);
      toast.error(msg);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setErro('');
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFicheiro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocumento(file);
    setUploadando(true);
    try {
      const form = new FormData();
      form.append('documento', file);
      const { data } = await api.post('/uploads/documento', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUrlDocumento(data.url);
      toast.success('Documento carregado com sucesso');
    } catch {
      toast.error('Erro ao carregar o documento. Tente novamente.');
      setDocumento(null);
      setUrlDocumento('');
      if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
    } finally {
      setUploadando(false);
    }
  };

  const removerDocumento = () => {
    setDocumento(null);
    setUrlDocumento('');
    if (inputFicheiroRef.current) inputFicheiroRef.current.value = '';
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.volume || Number(formData.volume) <= 0) {
      setErro(t('receptor.transfusao.error_volume'));
      return;
    }
    if (!formData.motivo.trim()) {
      setErro(t('receptor.transfusao.error_motive'));
      return;
    }
    if (!urlDocumento) {
      setErro('É obrigatório anexar o documento de autorização assinado pelo técnico de saúde.');
      return;
    }

    criarMutation.mutate({
      tipoSangue: formData.tipoSangue,
      volume: Number(formData.volume),
      urgencia: formData.urgencia,
      motivo: formData.motivo,
      observacoes: formData.observacoes || undefined,
      idHemocentro: formData.idHemocentro ? Number(formData.idHemocentro) : undefined,
      urlDocumentoAutorizacao: urlDocumento,
    });
  };

  if (sucesso) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold text-green-700">{t('receptor.transfusao.success_title')}</h2>
          <p className="text-green-600">{t('receptor.transfusao.success_msg')}</p>
          <p className="text-sm text-gray-500">{t('receptor.transfusao.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('receptor.transfusao.title')}</h1>
        <p className="text-gray-600">{t('receptor.transfusao.subtitle')}</p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {erro}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.transfusao.blood_type_label')}</label>
              <select
                name="tipoSangue"
                value={formData.tipoSangue}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((tp) => (
                  <option key={tp}>{tp}</option>
                ))}
              </select>
            </div>

            <Input
              label={t('receptor.transfusao.volume_label')}
              name="volume"
              type="number"
              value={formData.volume}
              onChange={handleChange}
              placeholder={t('receptor.transfusao.volume_placeholder')}
              required
            />
          </div>

          <Select
            label={t('receptor.transfusao.urgency_label')}
            name="urgencia"
            value={formData.urgencia}
            onChange={handleChange}
            options={[
              { value: 'normal', label: t('receptor.transfusao.urgency_normal') },
              { value: 'media', label: t('receptor.transfusao.urgency_media') },
              { value: 'urgente', label: t('receptor.transfusao.urgency_urgent') },
              { value: 'critica', label: t('receptor.transfusao.urgency_critical') },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('receptor.transfusao.motive_label')}
            </label>
            <select
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('receptor.transfusao.motive_select')}</option>
              <option value="Cirurgia programada">Cirurgia programada</option>
              <option value="Cirurgia de emergência">Cirurgia de emergência</option>
              <option value="Anemia severa">Anemia severa</option>
              <option value="Anemia crónica">Anemia crónica</option>
              <option value="Acidente / Trauma">Acidente / Trauma</option>
              <option value="Hemorragia">Hemorragia</option>
              <option value="Doença oncológica">Doença oncológica</option>
              <option value="Quimioterapia">Quimioterapia</option>
              <option value="Transplante">Transplante</option>
              <option value="Doença hemolítica">Doença hemolítica</option>
              <option value="Talassemia">Talassemia</option>
              <option value="Drepanocitose">Drepanocitose</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('receptor.transfusao.hemocentro_label')}
            </label>
            <select
              name="idHemocentro"
              value={formData.idHemocentro}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('receptor.transfusao.hemocentro_select')}</option>
              {hemocentros.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nome}{h.cidade ? ` — ${h.cidade}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('receptor.transfusao.notes_label')}
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder={t('receptor.transfusao.notes_placeholder')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Documento de autorização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento de autorização médica <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Anexe o documento assinado pelo Enfermeiro ou Médico que valida esta requisição de sangue. Formatos aceites: PDF, JPG, PNG (máx. 5 MB).
            </p>

            {!documento ? (
              <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploadando ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-red-50'
                }`}
              >
                <UploadCloud className={`w-8 h-8 mb-2 ${uploadando ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-500">
                  {uploadando ? 'A carregar documento...' : 'Clique para seleccionar o documento'}
                </span>
                <input
                  ref={inputFicheiroRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFicheiro}
                  disabled={uploadando}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-green-800 truncate max-w-xs">{documento.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="w-3.5 h-3.5" /> Carregado</span>
                </div>
                <button
                  type="button"
                  onClick={removerDocumento}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remover documento"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            type="submit"
            className="w-full"
            loading={criarMutation.isPending || uploadando}
            disabled={!urlDocumento || uploadando}
          >
            {criarMutation.isPending ? t('receptor.transfusao.sending') : t('receptor.transfusao.send_button')}
          </Button>
        </form>
      </Card>

      <Card title={t('receptor.transfusao.compatibility_title')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { tipo: 'O-', desc: 'Doador Universal' },
            { tipo: 'O+', desc: 'Compatível com O+' },
            { tipo: 'A+, A-', desc: 'Compatível' },
            { tipo: 'B+, AB+', desc: 'Compatível' },
          ].map((item) => (
            <div key={item.tipo} className="text-center">
              <p className="font-bold text-primary">{item.tipo}</p>
              <p className="text-gray-600 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
