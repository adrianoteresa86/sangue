import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Activity, CheckCircle, Loader2, Droplets, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface PedidoInfo {
  id: number;
  nomePaciente: string;
  tipoSanguinePaciente: string;
  tipoComponente: string;
  quantidadeSolicitada: number;
  hemocentro?: { id: number; nome: string };
}

interface EstoqueItem {
  id: number;
  tipoSangue: string;
  tipoComponente: string;
  quantidade: number;
  disponivel: boolean;
  dataValidade: string;
}

interface RegistroExistente {
  id: number;
  tipoSangue: string;
  tipoComponente: string;
  quantidadeAdministrada: number;
  prePressaoSistolica: number;
  prePressaoDiastolica: number;
  prePulso: number;
  preTemperatura: number;
  preFrequenciaRespiratoria: number;
  reacaoAdversa: boolean;
  descricaoReacaoAdversa?: string;
  concluida: boolean;
  observacoes?: string;
  estoqueSangue?: { id: number };
}

interface Props {
  pedido: PedidoInfo;
  onClose: () => void;
}

function Field({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && ' *'}</label>
      <input
        {...props}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
    </div>
  );
}

export const TriagemTransfusaoModal = ({ pedido, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const initialized = useRef(false);

  const [form, setForm] = useState({
    idEstoqueSangue: '',
    tipoSangue: pedido.tipoSanguinePaciente ?? '',
    tipoComponente: pedido.tipoComponente ?? '',
    quantidadeAdministrada: String(pedido.quantidadeSolicitada ?? ''),
    prePressaoSistolica: '',
    prePressaoDiastolica: '',
    prePulso: '',
    preTemperatura: '',
    preFrequenciaRespiratoria: '',
    reacaoAdversa: 'false',
    descricaoReacaoAdversa: '',
    observacoes: '',
  });

  const { data: registroExistente, isLoading: loadingRegistro } = useQuery<RegistroExistente | null>({
    queryKey: ['registro-transfusao-pedido', pedido.id],
    queryFn: async () => {
      try {
        const r = await api.get(`/registros-transfusao/pedido/${pedido.id}`);
        return r.data as RegistroExistente;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 0,
  });

  const { data: estoqueData = [] } = useQuery<EstoqueItem[]>({
    queryKey: ['estoque-sangue'],
    queryFn: () => api.get('/estoque-sangue').then((r) => Array.isArray(r.data) ? r.data : (r.data?.estoques ?? [])),
  });

  const hoje = new Date();
  const tiposPaciente = pedido.tipoSanguinePaciente;

  // Separar compatíveis dos restantes — mostrar todos, compatíveis primeiro
  const estoqueDisponivel = estoqueData.filter(
    (e) => e.disponivel && e.quantidade > 0 && new Date(e.dataValidade) > hoje,
  );
  const compativeis = estoqueDisponivel.filter((e) => !tiposPaciente || e.tipoSangue === tiposPaciente);
  const outros = estoqueDisponivel.filter((e) => tiposPaciente && e.tipoSangue !== tiposPaciente);

  useEffect(() => {
    if (initialized.current || loadingRegistro) return;
    initialized.current = true;
    if (registroExistente) {
      setForm((f) => ({
        ...f,
        idEstoqueSangue: String(registroExistente.estoqueSangue?.id ?? ''),
        tipoSangue: registroExistente.tipoSangue,
        tipoComponente: registroExistente.tipoComponente,
        quantidadeAdministrada: String(registroExistente.quantidadeAdministrada),
        prePressaoSistolica: String(registroExistente.prePressaoSistolica),
        prePressaoDiastolica: String(registroExistente.prePressaoDiastolica),
        prePulso: String(registroExistente.prePulso),
        preTemperatura: String(registroExistente.preTemperatura),
        preFrequenciaRespiratoria: String(registroExistente.preFrequenciaRespiratoria),
        reacaoAdversa: registroExistente.reacaoAdversa ? 'true' : 'false',
        descricaoReacaoAdversa: registroExistente.descricaoReacaoAdversa ?? '',
        observacoes: registroExistente.observacoes ?? '',
      }));
      setStep(2);
    }
  }, [loadingRegistro, registroExistente]);

  const criarMutation = useMutation({
    mutationFn: async (dados: object) => {
      const registro = await api.post('/registros-transfusao', dados).then((r) => r.data);
      await api.patch(`/pedidos-transfusao/${pedido.id}/status`, { status: 'IN_PROGRESS' });
      return registro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-transfusao'] });
      queryClient.invalidateQueries({ queryKey: ['registro-transfusao-pedido', pedido.id] });
      toast.success('Triagem pré-transfusional registada. Transfusão em andamento.');
      setStep(2);
    },
    onError: (err: { response?: { data?: { erro?: string } } }) => {
      toast.error(err.response?.data?.erro ?? 'Erro ao registar triagem');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idEstoqueSangue) { toast.error('Seleccione o lote de sangue do estoque'); return; }
    criarMutation.mutate({
      idPedido: pedido.id,
      idHemocentro: pedido.hemocentro?.id,
      idEstoqueSangue: Number(form.idEstoqueSangue),
      tipoSangue: form.tipoSangue,
      tipoComponente: form.tipoComponente,
      quantidadeAdministrada: Number(form.quantidadeAdministrada),
      prePressaoSistolica: Number(form.prePressaoSistolica),
      prePressaoDiastolica: Number(form.prePressaoDiastolica),
      prePulso: Number(form.prePulso),
      preTemperatura: Number(form.preTemperatura),
      preFrequenciaRespiratoria: Number(form.preFrequenciaRespiratoria),
      reacaoAdversa: form.reacaoAdversa === 'true',
      descricaoReacaoAdversa: form.reacaoAdversa === 'true' ? form.descricaoReacaoAdversa : undefined,
      observacoes: form.observacoes || undefined,
    });
  };

  const steps = [
    { n: 1, label: 'Verificação Pré-Transfusional', Icon: Activity },
    { n: 2, label: 'Resultado',                     Icon: CheckCircle },
  ] as const;

  const isLoading = loadingRegistro;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', borderRadius: '1rem 1rem 0 0' }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">Triagem Pré-Transfusional</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {pedido.nomePaciente} · {pedido.tipoSanguinePaciente}
              {pedido.hemocentro && ` · ${pedido.hemocentro.nome}`}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de passos */}
        <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          {steps.map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === n ? 'bg-blue-600 text-white shadow-md' : step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${
                step === n ? 'text-blue-700' : step > n ? 'text-green-600' : 'text-gray-400'
              }`}>{label}</span>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 hidden sm:block ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : step === 1 ? (
            <form id="form-triagem-transfusao" onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-500">
                Preencha os dados pré-transfusionais. Verifique a compatibilidade sanguínea antes de iniciar.
              </p>

              {/* Produto sanguíneo */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> Produto Sanguíneo
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Lote do Estoque *</label>
                  <select
                    required
                    value={form.idEstoqueSangue}
                    onChange={(e) => setForm((f) => ({ ...f, idEstoqueSangue: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Seleccionar lote…</option>
                    {compativeis.length > 0 && (
                      <optgroup label={`Compatível com ${tiposPaciente ?? 'paciente'}`}>
                        {compativeis.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.tipoSangue} · {e.tipoComponente} · {e.quantidade} mL · val. {new Date(e.dataValidade).toLocaleDateString('pt-PT')}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {outros.length > 0 && (
                      <optgroup label="Outros lotes disponíveis">
                        {outros.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.tipoSangue} · {e.tipoComponente} · {e.quantidade} mL · val. {new Date(e.dataValidade).toLocaleDateString('pt-PT')}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {estoqueDisponivel.length === 0 && (
                      <option disabled>Nenhum lote disponível no estoque</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Sanguíneo *</label>
                    <select
                      required
                      value={form.tipoSangue}
                      onChange={(e) => setForm((f) => ({ ...f, tipoSangue: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Seleccionar</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Componente *</label>
                    <select
                      required
                      value={form.tipoComponente}
                      onChange={(e) => setForm((f) => ({ ...f, tipoComponente: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {['Sangue Total','Plasma','Plaquetas','Glóbulos Vermelhos','Crioprecipitado'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <Field
                    label="Volume (mL) *" required type="number" min="1"
                    value={form.quantidadeAdministrada}
                    onChange={(e) => setForm((f) => ({ ...f, quantidadeAdministrada: e.target.value }))}
                  />
                </div>
              </div>

              {/* Sinais vitais pré */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" /> Sinais Vitais Pré-Transfusionais
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pressão Sistólica (mmHg) *" required type="number" min="0" placeholder="Ex: 120"
                    value={form.prePressaoSistolica}
                    onChange={(e) => setForm((f) => ({ ...f, prePressaoSistolica: e.target.value }))} />
                  <Field label="Pressão Diastólica (mmHg) *" required type="number" min="0" placeholder="Ex: 80"
                    value={form.prePressaoDiastolica}
                    onChange={(e) => setForm((f) => ({ ...f, prePressaoDiastolica: e.target.value }))} />
                  <Field label="Pulso (bpm) *" required type="number" min="0" placeholder="Ex: 72"
                    value={form.prePulso}
                    onChange={(e) => setForm((f) => ({ ...f, prePulso: e.target.value }))} />
                  <Field label="Temperatura (°C) *" required type="number" step="0.1" min="35" max="42" placeholder="Ex: 36.5"
                    value={form.preTemperatura}
                    onChange={(e) => setForm((f) => ({ ...f, preTemperatura: e.target.value }))} />
                  <Field label="Freq. Respiratória (rpm) *" required type="number" min="0" placeholder="Ex: 16"
                    value={form.preFrequenciaRespiratoria}
                    onChange={(e) => setForm((f) => ({ ...f, preFrequenciaRespiratoria: e.target.value }))} />
                </div>
              </div>

              {/* Reação adversa */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Reacção Adversa Prévia?</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="reacaoAdversa" value="false"
                      checked={form.reacaoAdversa === 'false'}
                      onChange={(e) => setForm((f) => ({ ...f, reacaoAdversa: e.target.value }))}
                      className="accent-green-600 w-4 h-4" />
                    <span className="text-sm font-semibold text-green-700">Não</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="reacaoAdversa" value="true"
                      checked={form.reacaoAdversa === 'true'}
                      onChange={(e) => setForm((f) => ({ ...f, reacaoAdversa: e.target.value }))}
                      className="accent-red-600 w-4 h-4" />
                    <span className="text-sm font-semibold text-red-700">Sim</span>
                  </label>
                </div>
                {form.reacaoAdversa === 'true' && (
                  <textarea
                    value={form.descricaoReacaoAdversa}
                    onChange={(e) => setForm((f) => ({ ...f, descricaoReacaoAdversa: e.target.value }))}
                    rows={2} placeholder="Descreva a reacção adversa..."
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações adicionais..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </form>
          ) : (
            /* Passo 2: Resultado */
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-blue-700">Triagem Registada</h3>
                <p className="text-sm text-blue-600 mt-1">
                  A transfusão está em andamento. Monitorize o paciente durante o procedimento.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Dados Registados
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([
                    ['Tipo Sanguíneo', form.tipoSangue],
                    ['Componente', form.tipoComponente],
                    ['Volume', `${form.quantidadeAdministrada} mL`],
                    ['Pressão', `${form.prePressaoSistolica}/${form.prePressaoDiastolica} mmHg`],
                    ['Pulso', `${form.prePulso} bpm`],
                    ['Temperatura', `${form.preTemperatura} °C`],
                    ['Freq. Resp.', `${form.preFrequenciaRespiratoria} rpm`],
                    ['Reacção Adversa', form.reacaoAdversa === 'true'
                      ? <span className="inline-flex items-center gap-1">Sim <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>
                      : <span className="inline-flex items-center gap-1">Não <Check className="w-3.5 h-3.5 text-green-600" /></span>],
                  ] as [string, ReactNode][]).map(([l, v]) => (
                    <div key={l}>
                      <p className="text-xs text-gray-500">{l}</p>
                      <p className="font-semibold text-gray-800">{v}</p>
                    </div>
                  ))}
                </div>
                {form.observacoes && (
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <span className="font-semibold">Obs:</span> {form.observacoes}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {step === 2 ? 'Fechar' : 'Cancelar'}
          </button>

          {step === 1 && !registroExistente && !isLoading && (
            <button
              type="submit" form="form-triagem-transfusao"
              disabled={criarMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {criarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Registar Triagem e Iniciar <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
