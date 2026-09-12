import { useQuery } from '@tanstack/react-query';
import { X, Calendar, CheckCircle, XCircle, Activity, FlaskConical, Loader2, User, Phone } from 'lucide-react';
import api from '../../services/api';

interface AgendamentoInfo {
  id: number;
  usuario: { id: number; nome: string; email: string; telefone?: string };
  hemocentro: { id: number; nome: string; cidade?: string };
  dataPreferida: string;
  horaPreferida?: string;
  tipoSangue?: string;
  status: string;
  nomeContatoEmergencia?: string;
  telefoneContatoEmergencia?: string;
  observacoes?: string;
  criadoEm?: string;
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
}

interface HistoricoModalProps {
  agendamento: AgendamentoInfo;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:       'Pendente',
  APPROVED:      'Aprovado',
  IN_PROCESSING: 'Em Processamento',
  COMPLETED:     'Concluído',
  REFUSED:       'Recusado',
  CANCELLED:     'Cancelado',
};

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  PENDING:       { bg: '#fef9c3', color: '#854d0e' },
  APPROVED:      { bg: '#dbeafe', color: '#1d4ed8' },
  IN_PROCESSING: { bg: '#ede9fe', color: '#5b21b6' },
  COMPLETED:     { bg: '#dcfce7', color: '#166534' },
  REFUSED:       { bg: '#fee2e2', color: '#991b1b' },
  CANCELLED:     { bg: '#f3f4f6', color: '#6b7280' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

export const HistoricoModal = ({ agendamento, onClose }: HistoricoModalProps) => {
  const status = agendamento.status;

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
    staleTime: 30000,
  });

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
    staleTime: 30000,
  });

  const isLoadingDetails = loadingRegistro || (!!registroData && loadingTeste);

  const algumPositivo = testeData
    ? [testeData.hiv, testeData.hepatiteB, testeData.hepatiteC, testeData.sifilis, testeData.chagas, testeData.htlv].some((v) => v === true)
    : false;

  // Build timeline
  type Step = { label: string; sublabel?: string; done: boolean; failed: boolean; Icon: React.ElementType };
  const steps: Step[] = [
    { label: 'Agendamento Criado', sublabel: agendamento.criadoEm ? formatDate(agendamento.criadoEm) : undefined, done: true, failed: false, Icon: Calendar },
  ];

  if (status === 'CANCELLED') {
    steps.push({ label: 'Cancelado', done: true, failed: true, Icon: XCircle });
  } else {
    steps.push({
      label: 'Aprovado',
      done: status !== 'PENDING',
      failed: false,
      Icon: CheckCircle,
    });
    steps.push({
      label: 'Triagem Clínica',
      sublabel: registroData
        ? registroData.elegivel
          ? 'Doador apto para doação'
          : `Inapto: ${registroData.motivoInelegibilidade ?? '—'}`
        : undefined,
      done: !!registroData,
      failed: registroData ? !registroData.elegivel : false,
      Icon: Activity,
    });
    if (registroData?.elegivel !== false) {
      steps.push({
        label: 'Testes Laboratoriais',
        sublabel: testeData ? (algumPositivo ? 'Teste(s) positivo(s) detectado(s)' : 'Todos os testes negativos') : undefined,
        done: !!testeData,
        failed: algumPositivo,
        Icon: FlaskConical,
      });
    }
    if (status === 'COMPLETED' || status === 'REFUSED') {
      steps.push({
        label: status === 'COMPLETED' ? 'Doação Concluída com Sucesso' : 'Doação Recusada',
        done: true,
        failed: status === 'REFUSED',
        Icon: status === 'COMPLETED' ? CheckCircle : XCircle,
      });
    }
  }

  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-stretch justify-end">
      <div className="bg-white h-full w-full max-w-sm flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, #450a0a, #991b1b)' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">Histórico</h2>
            <p className="text-red-200 text-xs mt-0.5">#{agendamento.id} · {agendamento.usuario.nome}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

          {/* Informação básica */}
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{agendamento.hemocentro.nome}</p>
                {agendamento.hemocentro.cidade && (
                  <p className="text-xs text-gray-500">{agendamento.hemocentro.cidade}</p>
                )}
              </div>
              <span
                className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-full"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(agendamento.dataPreferida)}
                {agendamento.horaPreferida && ` · ${agendamento.horaPreferida}`}
              </span>
              {agendamento.tipoSangue && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  {agendamento.tipoSangue}
                </span>
              )}
            </div>
            {agendamento.observacoes && (
              <p className="text-xs text-gray-400 mt-2 italic">"{agendamento.observacoes}"</p>
            )}
          </div>

          {/* Contacto de emergência */}
          {(agendamento.nomeContatoEmergencia || agendamento.telefoneContatoEmergencia) && (
            <div className="px-5 py-3 bg-orange-50">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Contacto de Emergência</p>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <p className="text-sm text-gray-800 font-medium">{agendamento.nomeContatoEmergencia}</p>
              </div>
              {agendamento.telefoneContatoEmergencia && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <p className="text-sm text-gray-600">{agendamento.telefoneContatoEmergencia}</p>
                </div>
              )}
            </div>
          )}

          {/* Linha de tempo */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Linha de Tempo</p>
            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-0">
              {steps.map(({ label, sublabel, done, failed, Icon }, i) => (
                <li key={i} className="mb-5 ml-5 last:mb-0">
                  <span
                    className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-2 ring-white ${
                      !done ? 'bg-gray-100' : failed ? 'bg-red-100' : 'bg-green-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${!done ? 'text-gray-300' : failed ? 'text-red-500' : 'text-green-600'}`} />
                  </span>
                  <p className={`text-sm font-semibold leading-tight pt-0.5 ${!done ? 'text-gray-300' : failed ? 'text-red-600' : 'text-gray-800'}`}>
                    {label}
                  </p>
                  {sublabel && (
                    <p className={`text-xs mt-0.5 ${failed ? 'text-red-400' : 'text-gray-500'}`}>{sublabel}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Detalhes da triagem clínica */}
          {isLoadingDetails ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            </div>
          ) : registroData ? (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Triagem Clínica</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {([
                  ['Hemoglobina', `${registroData.nivelHemoglobina} g/dL`],
                  ['Pressão', `${registroData.pressaoSistolica}/${registroData.pressaoDiastolica}`],
                  ['Pulso', `${registroData.pulso} bpm`],
                  ['Temperatura', `${registroData.temperatura} °C`],
                  ['Peso', `${registroData.peso} kg`],
                  ['Volume', `${registroData.quantidade} ml`],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs text-gray-400">{l}</p>
                    <p className="text-xs font-bold text-gray-700">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${registroData.elegivel ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {registroData.elegivel ? 'APTO' : 'INAPTO'}
                </span>
                <span className="text-xs text-gray-500">{registroData.tipoSangue} · {registroData.tipoComponente}</span>
              </div>
            </div>
          ) : null}

          {/* Resultados laboratoriais */}
          {testeData && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Testes Laboratoriais</p>
              <div className="space-y-2">
                {([
                  ['HIV', testeData.hiv],
                  ['Hepatite B', testeData.hepatiteB],
                  ['Hepatite C', testeData.hepatiteC],
                  ['Sífilis', testeData.sifilis],
                  ['Doença de Chagas', testeData.chagas],
                  ['HTLV I/II', testeData.htlv],
                ] as [string, boolean | null][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${value ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {value ? 'POSITIVO' : 'NEGATIVO'}
                    </span>
                  </div>
                ))}
              </div>
              {testeData.tipoSanguineo && (
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-100">
                  Tipo confirmado:{' '}
                  <span className="font-bold text-gray-700">
                    {testeData.tipoSanguineo} {testeData.fatorRh ? '(Rh+)' : '(Rh-)'}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
