import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Activity, FlaskConical, CheckCircle, XCircle, Loader2, Check, ArrowRight } from 'lucide-react';
import api from '../../services/api';

interface AgendamentoInfo {
  id: number;
  usuario: { id: number; nome: string; email: string };
  hemocentro: { id: number; nome: string };
  tipoSangue?: string;
}

interface RegistroDoacao {
  id: number;
  nivelHemoglobina: number;
  pressaoSistolica: number;
  pressaoDiastolica: number;
  pulso: number;
  temperatura: number;
  peso: number;
  tipoSangue: string;
  tipoComponente: string;
  quantidade: number;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  observacoes?: string;
}

interface TesteSangue {
  id: number;
  status: string;
  hiv: boolean | null;
  hepatiteB: boolean | null;
  hepatiteC: boolean | null;
  sifilis: boolean | null;
  chagas: boolean | null;
  htlv: boolean | null;
  tipoSanguineo?: string;
  fatorRh: boolean | null;
  observacoes?: string;
}

interface TriagemModalProps {
  agendamento: AgendamentoInfo;
  onClose: () => void;
}

const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTES = ['Sangue Total', 'Plasma', 'Plaquetas', 'Glóbulos Vermelhos'];

function TestRadio({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-5">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={value === false}
            onChange={() => onChange(false)}
            className="accent-green-600 w-4 h-4"
          />
          <span className="text-sm text-green-700 font-semibold">Negativo</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={value === true}
            onChange={() => onChange(true)}
            className="accent-red-600 w-4 h-4"
          />
          <span className="text-sm text-red-700 font-semibold">Positivo</span>
        </label>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && ' *'}
      </label>
      <input
        {...props}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
      />
    </div>
  );
}

export const TriagemModal = ({ agendamento, onClose }: TriagemModalProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const stepInitialized = useRef(false);

  const [form1, setForm1] = useState({
    nivelHemoglobina: '',
    pressaoSistolica: '',
    pressaoDiastolica: '',
    pulso: '',
    temperatura: '',
    peso: '',
    tipoSangue: agendamento.tipoSangue ?? '',
    tipoComponente: 'Sangue Total',
    quantidade: '450',
    elegivel: 'true',
    motivoInelegibilidade: '',
    observacoes: '',
  });

  const [form2, setForm2] = useState({
    hiv: null as boolean | null,
    hepatiteB: null as boolean | null,
    hepatiteC: null as boolean | null,
    sifilis: null as boolean | null,
    chagas: null as boolean | null,
    htlv: null as boolean | null,
    tipoSanguineo: agendamento.tipoSangue ?? '',
    fatorRh: 'true',
    status: 'COMPLETED',
    observacoes: '',
  });

  // Carregar RegistroDoacao existente para este agendamento
  const { data: registroData, isLoading: loadingRegistro } = useQuery<RegistroDoacao | null>({
    queryKey: ['registro-triagem', agendamento.id],
    queryFn: async () => {
      try {
        const r = await api.get(`/registros-doacao/agendamento/${agendamento.id}`);
        return r.data as RegistroDoacao;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 0,
  });

  // Carregar TesteSangue existente para o RegistroDoacao
  const { data: testeData, isLoading: loadingTeste } = useQuery<TesteSangue | null>({
    queryKey: ['teste-triagem', registroData?.id],
    queryFn: async () => {
      try {
        const r = await api.get(`/testes-sangue/registro/${registroData!.id}`);
        return r.data as TesteSangue;
      } catch {
        return null;
      }
    },
    enabled: !!registroData?.id,
    retry: false,
    staleTime: 0,
  });

  // Definir o passo inicial com base nos dados existentes
  useEffect(() => {
    const registroSettled = !loadingRegistro;
    const testeSettled = !registroData || !loadingTeste;
    if (!registroSettled || !testeSettled || stepInitialized.current) return;
    stepInitialized.current = true;
    if (testeData) setStep(3);
    else if (registroData) setStep(2);
    else setStep(1);
  }, [loadingRegistro, loadingTeste, registroData, testeData]);

  const criarRegistroMutation = useMutation({
    mutationFn: (dados: object) => api.post('/registros-doacao', dados).then((r) => r.data),
    onSuccess: (data: RegistroDoacao) => {
      queryClient.setQueryData(['registro-triagem', agendamento.id], data);
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setStep(2);
      toast.success('Triagem clínica registada com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.erro ?? 'Erro ao registar triagem clínica');
    },
  });

  const criarTesteMutation = useMutation({
    mutationFn: (dados: object) => api.post('/testes-sangue', dados).then((r) => r.data),
    onSuccess: (data: TesteSangue) => {
      queryClient.setQueryData(['teste-triagem', registroData?.id], data);
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      setStep(3);
      toast.success('Testes laboratoriais registados com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.erro ?? 'Erro ao registar testes laboratoriais');
    },
  });

  const handleStep1Submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    criarRegistroMutation.mutate({
      idDoador: agendamento.usuario.id,
      idHemocentro: agendamento.hemocentro.id,
      idAgendamento: agendamento.id,
      quantidade: Number(form1.quantidade),
      tipoSangue: form1.tipoSangue,
      tipoComponente: form1.tipoComponente,
      nivelHemoglobina: Number(form1.nivelHemoglobina),
      pressaoSistolica: Number(form1.pressaoSistolica),
      pressaoDiastolica: Number(form1.pressaoDiastolica),
      pulso: Number(form1.pulso),
      temperatura: Number(form1.temperatura),
      peso: Number(form1.peso),
      elegivel: form1.elegivel === 'true',
      motivoInelegibilidade: form1.elegivel === 'false' ? form1.motivoInelegibilidade : undefined,
      observacoes: form1.observacoes || undefined,
    });
  };

  const handleStep2Submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!registroData) return;
    const tests = [form2.hiv, form2.hepatiteB, form2.hepatiteC, form2.sifilis, form2.chagas, form2.htlv];
    if (tests.some((v) => v === null)) {
      toast.error('Por favor, preencha todos os testes sorológicos.');
      return;
    }
    criarTesteMutation.mutate({
      idRegistroDoacao: registroData.id,
      status: form2.status,
      hiv: form2.hiv,
      hepatiteB: form2.hepatiteB,
      hepatiteC: form2.hepatiteC,
      sifilis: form2.sifilis,
      chagas: form2.chagas,
      htlv: form2.htlv,
      tipoSanguineo: form2.tipoSanguineo || undefined,
      fatorRh: form2.fatorRh === 'true',
      observacoes: form2.observacoes || undefined,
    });
  };

  const isLoading = loadingRegistro || (!!registroData && loadingTeste);

  const sangueAprovado =
    testeData && registroData
      ? registroData.elegivel &&
        testeData.hiv === false &&
        testeData.hepatiteB === false &&
        testeData.hepatiteC === false &&
        testeData.sifilis === false &&
        testeData.chagas === false &&
        testeData.htlv === false
      : false;

  const steps = [
    { n: 1, label: 'Triagem Clínica', Icon: Activity },
    { n: 2, label: 'Testes Laboratoriais', Icon: FlaskConical },
    { n: 3, label: 'Resultado', Icon: CheckCircle },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, #450a0a, #991b1b)', borderRadius: '1rem 1rem 0 0' }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">Triagem de Sangue</h2>
            <p className="text-red-200 text-sm mt-0.5">
              {agendamento.usuario.nome} · {agendamento.hemocentro.nome}
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
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === n
                    ? 'bg-red-600 text-white shadow-md'
                    : step > n
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:block ${
                  step === n ? 'text-red-700' : step > n ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
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
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : step === 1 ? (
            /* ── Passo 1: Triagem Clínica ── */
            <form id="form-triagem-1" onSubmit={handleStep1Submit} className="space-y-4">
              <p className="text-sm text-gray-500">Preencha os dados da avaliação clínica do doador.</p>

              <div className="grid grid-cols-2 gap-4">
                <FieldInput
                  label="Hemoglobina (g/dL)" required type="number" step="0.1" min="0"
                  value={form1.nivelHemoglobina} placeholder="Ex: 14.5"
                  onChange={(e) => setForm1((f) => ({ ...f, nivelHemoglobina: e.target.value }))}
                />
                <FieldInput
                  label="Peso (kg)" required type="number" step="0.1" min="50"
                  value={form1.peso} placeholder="Mín. 50 kg"
                  onChange={(e) => setForm1((f) => ({ ...f, peso: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FieldInput
                  label="Pressão Sistólica (mmHg)" required type="number" min="0"
                  value={form1.pressaoSistolica} placeholder="Ex: 120"
                  onChange={(e) => setForm1((f) => ({ ...f, pressaoSistolica: e.target.value }))}
                />
                <FieldInput
                  label="Pressão Diastólica (mmHg)" required type="number" min="0"
                  value={form1.pressaoDiastolica} placeholder="Ex: 80"
                  onChange={(e) => setForm1((f) => ({ ...f, pressaoDiastolica: e.target.value }))}
                />
                <FieldInput
                  label="Pulso (bpm)" required type="number" min="0"
                  value={form1.pulso} placeholder="Ex: 72"
                  onChange={(e) => setForm1((f) => ({ ...f, pulso: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldInput
                  label="Temperatura (°C)" required type="number" step="0.1" min="35" max="42"
                  value={form1.temperatura} placeholder="Ex: 36.5"
                  onChange={(e) => setForm1((f) => ({ ...f, temperatura: e.target.value }))}
                />
                <FieldInput
                  label="Volume coletado (ml)" required type="number" min="1"
                  value={form1.quantidade} placeholder="Ex: 450"
                  onChange={(e) => setForm1((f) => ({ ...f, quantidade: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Sanguíneo *</label>
                  <select
                    required value={form1.tipoSangue}
                    onChange={(e) => setForm1((f) => ({ ...f, tipoSangue: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">Selecionar</option>
                    {TIPOS_SANGUINEOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Componente *</label>
                  <select
                    required value={form1.tipoComponente}
                    onChange={(e) => setForm1((f) => ({ ...f, tipoComponente: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    {COMPONENTES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Elegibilidade *</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="elegivel" value="true"
                      checked={form1.elegivel === 'true'}
                      onChange={(e) => setForm1((f) => ({ ...f, elegivel: e.target.value }))}
                      className="accent-green-600 w-4 h-4" />
                    <span className="text-sm font-semibold text-green-700">Apto para doação</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="elegivel" value="false"
                      checked={form1.elegivel === 'false'}
                      onChange={(e) => setForm1((f) => ({ ...f, elegivel: e.target.value }))}
                      className="accent-red-600 w-4 h-4" />
                    <span className="text-sm font-semibold text-red-700">Inapto</span>
                  </label>
                </div>
              </div>

              {form1.elegivel === 'false' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo de Inelegibilidade *</label>
                  <textarea
                    required
                    value={form1.motivoInelegibilidade}
                    onChange={(e) => setForm1((f) => ({ ...f, motivoInelegibilidade: e.target.value }))}
                    rows={2} placeholder="Descreva o motivo..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
                <textarea
                  value={form1.observacoes}
                  onChange={(e) => setForm1((f) => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações adicionais..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>
            </form>
          ) : step === 2 ? (
            /* ── Passo 2: Testes Laboratoriais ── */
            <form id="form-triagem-2" onSubmit={handleStep2Submit} className="space-y-4">
              <p className="text-sm text-gray-500">Registe os resultados dos testes sorológicos laboratoriais.</p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Testes Sorológicos</h3>
                <TestRadio label="HIV" value={form2.hiv} onChange={(v) => setForm2((f) => ({ ...f, hiv: v }))} />
                <TestRadio label="Hepatite B" value={form2.hepatiteB} onChange={(v) => setForm2((f) => ({ ...f, hepatiteB: v }))} />
                <TestRadio label="Hepatite C" value={form2.hepatiteC} onChange={(v) => setForm2((f) => ({ ...f, hepatiteC: v }))} />
                <TestRadio label="Sífilis" value={form2.sifilis} onChange={(v) => setForm2((f) => ({ ...f, sifilis: v }))} />
                <TestRadio label="Doença de Chagas" value={form2.chagas} onChange={(v) => setForm2((f) => ({ ...f, chagas: v }))} />
                <TestRadio label="HTLV I/II" value={form2.htlv} onChange={(v) => setForm2((f) => ({ ...f, htlv: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Sanguíneo Confirmado</label>
                  <select
                    value={form2.tipoSanguineo}
                    onChange={(e) => setForm2((f) => ({ ...f, tipoSanguineo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">Selecionar</option>
                    {TIPOS_SANGUINEOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Fator Rh</label>
                  <div className="flex gap-5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="fatorRh" value="true"
                        checked={form2.fatorRh === 'true'}
                        onChange={(e) => setForm2((f) => ({ ...f, fatorRh: e.target.value }))}
                        className="accent-gray-600 w-4 h-4" />
                      <span className="text-sm font-medium">Positivo (+)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="fatorRh" value="false"
                        checked={form2.fatorRh === 'false'}
                        onChange={(e) => setForm2((f) => ({ ...f, fatorRh: e.target.value }))}
                        className="accent-gray-600 w-4 h-4" />
                      <span className="text-sm font-medium">Negativo (-)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado dos Testes</label>
                <select
                  value={form2.status}
                  onChange={(e) => setForm2((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="IN_PROGRESS">Em Andamento</option>
                  <option value="COMPLETED">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
                <textarea
                  value={form2.observacoes}
                  onChange={(e) => setForm2((f) => ({ ...f, observacoes: e.target.value }))}
                  rows={2} placeholder="Observações sobre os testes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>
            </form>
          ) : (
            /* ── Passo 3: Resultado ── */
            <div className="space-y-5">
              {/* Resultado geral */}
              <div
                className={`rounded-xl p-5 text-center border ${
                  sangueAprovado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                {sangueAprovado ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-green-700">Sangue Aprovado</h3>
                    <p className="text-sm text-green-600 mt-1">
                      Doador apto e todos os testes sorológicos negativos.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-red-700">Sangue Reprovado</h3>
                    <p className="text-sm text-red-600 mt-1">
                      {registroData && !registroData.elegivel
                        ? `Doador inapto: ${registroData.motivoInelegibilidade ?? 'motivo não especificado'}`
                        : 'Um ou mais testes sorológicos foram positivos.'}
                    </p>
                  </>
                )}
              </div>

              {/* Resumo triagem clínica */}
              {registroData && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500" /> Triagem Clínica
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ['Hemoglobina', `${registroData.nivelHemoglobina} g/dL`],
                      ['Pressão', `${registroData.pressaoSistolica}/${registroData.pressaoDiastolica} mmHg`],
                      ['Pulso', `${registroData.pulso} bpm`],
                      ['Temperatura', `${registroData.temperatura} °C`],
                      ['Peso', `${registroData.peso} kg`],
                      ['Volume', `${registroData.quantidade} ml`],
                      ['Tipo Sanguíneo', registroData.tipoSangue],
                      ['Componente', registroData.tipoComponente],
                      ['Elegível', registroData.elegivel
                        ? <span className="inline-flex items-center gap-1">Sim <Check className="w-3.5 h-3.5 text-green-600" /></span>
                        : <span className="inline-flex items-center gap-1">Não <X className="w-3.5 h-3.5 text-red-600" /></span>],
                    ] as [string, ReactNode][]).map(([l, v]) => (
                      <div key={l}>
                        <p className="text-xs text-gray-500">{l}</p>
                        <p className="text-sm font-semibold text-gray-800">{v}</p>
                      </div>
                    ))}
                  </div>
                  {registroData.observacoes && (
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                      <span className="font-semibold">Obs:</span> {registroData.observacoes}
                    </p>
                  )}
                </div>
              )}

              {/* Resumo testes laboratoriais */}
              {testeData && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-blue-500" /> Testes Laboratoriais
                  </h4>
                  <div className="space-y-0">
                    {(
                      [
                        ['HIV', testeData.hiv],
                        ['Hepatite B', testeData.hepatiteB],
                        ['Hepatite C', testeData.hepatiteC],
                        ['Sífilis', testeData.sifilis],
                        ['Doença de Chagas', testeData.chagas],
                        ['HTLV I/II', testeData.htlv],
                      ] as [string, boolean | null][]
                    ).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            value ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {value ? 'POSITIVO' : 'NEGATIVO'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {testeData.tipoSanguineo && (
                    <p className="text-sm mt-3 pt-3 border-t border-gray-200 text-gray-700">
                      <span className="text-xs text-gray-500">Tipo confirmado: </span>
                      <span className="font-bold">
                        {testeData.tipoSanguineo} {testeData.fatorRh ? '(Rh+)' : '(Rh-)'}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {step === 3 ? 'Fechar' : 'Cancelar'}
          </button>

          {step === 1 && !isLoading && (
            <button
              type="submit" form="form-triagem-1"
              disabled={criarRegistroMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {criarRegistroMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Registar Triagem Clínica <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="submit" form="form-triagem-2"
              disabled={criarTesteMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {criarTesteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Registar Testes Laboratoriais <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
