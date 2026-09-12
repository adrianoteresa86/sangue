import { useState } from 'react';
import { FileDown, ChevronDown, Calendar, X } from 'lucide-react';
import { type Periodo } from '../../utilitarios/gerarPDF';

interface Props {
  onExportar: (periodo: Periodo, customInicio?: string, customFim?: string) => void;
  carregando?: boolean;
}

const RAPIDOS: { valor: Periodo; label: string }[] = [
  { valor: 'diario',  label: 'Hoje'           },
  { valor: 'semanal', label: 'Últimos 7 dias'  },
  { valor: 'mensal',  label: 'Últimos 30 dias' },
];

export const BotaoExportarPDF = ({ onExportar, carregando }: Props) => {
  const [aberto,       setAberto]       = useState(false);
  const [modalDatas,   setModalDatas]   = useState(false);
  const [dataInicio,   setDataInicio]   = useState('');
  const [dataFim,      setDataFim]      = useState('');

  const escolher = (periodo: Periodo) => {
    setAberto(false);
    onExportar(periodo);
  };

  const abrirPersonalizado = () => {
    setAberto(false);
    setModalDatas(true);
  };

  const confirmarPersonalizado = () => {
    if (!dataInicio || !dataFim) return;
    setModalDatas(false);
    onExportar('personalizado', dataInicio, dataFim);
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Botão principal + dropdown */}
      <div className="relative">
        <button
          onClick={() => setAberto((v) => !v)}
          disabled={carregando}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
          style={{ background: '#991b1b' }}
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>

        {aberto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
              <p className="text-[10px] font-semibold text-gray-400 uppercase px-4 pt-3 pb-1 tracking-wider">
                Período rápido
              </p>
              {RAPIDOS.map((o) => (
                <button
                  key={o.valor}
                  onClick={() => escolher(o.valor)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                >
                  <FileDown className="w-3.5 h-3.5 text-gray-400" />
                  {o.label}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1" />
              <button
                onClick={abrirPersonalizado}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
              >
                <Calendar className="w-3.5 h-3.5" />
                Período personalizado…
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de datas personalizadas */}
      {modalDatas && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                Período personalizado
              </h3>
              <button onClick={() => setModalDatas(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data de início</label>
                <input
                  type="date"
                  value={dataInicio}
                  max={dataFim || hoje}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data de fim</label>
                <input
                  type="date"
                  value={dataFim}
                  min={dataInicio}
                  max={hoje}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalDatas(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPersonalizado}
                disabled={!dataInicio || !dataFim}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40"
                style={{ background: '#991b1b' }}
              >
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
