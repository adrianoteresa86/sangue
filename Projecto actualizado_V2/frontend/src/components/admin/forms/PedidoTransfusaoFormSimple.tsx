import React, { useState, useEffect } from 'react';
import { Button } from '../../common/Button';

interface PedidoTransfusaoFormData {
  idHemocentro: number;
  nomePaciente: string;
  tipoSanguineoPaciente: string;
  idadePaciente: number;
  generoPaciente: string;
  numeroProntuario: string;
  diagnostico: string;
  tipoComponente: string;
  quantidadeSolicitada: number;
  nivelUrgencia: number;
  precisaAte: string;
  indicacaoClinica?: string;
  contatoMedico?: string;
  observacoes?: string;
}

interface PedidoTransfusaoFormProps {
  title: string;
  onSubmit: (data: PedidoTransfusaoFormData) => void;
  initialData?: any;
  loading?: boolean;
  hemocentros: any[];
}

export const PedidoTransfusaoFormSimple: React.FC<PedidoTransfusaoFormProps> = ({
  title,
  onSubmit,
  initialData,
  loading = false,
  hemocentros
}) => {
  const [formData, setFormData] = useState<PedidoTransfusaoFormData>({
    idHemocentro: initialData?.idHemocentro || 0,
    nomePaciente: initialData?.nomePaciente || '',
    tipoSanguineoPaciente: initialData?.tipoSanguineoPaciente || '',
    idadePaciente: initialData?.idadePaciente || 0,
    generoPaciente: initialData?.generoPaciente || 'Masculino',
    numeroProntuario: initialData?.numeroProntuario || '',
    diagnostico: initialData?.diagnostico || '',
    tipoComponente: initialData?.tipoComponente || '',
    quantidadeSolicitada: initialData?.quantidadeSolicitada || 0,
    nivelUrgencia: initialData?.nivelUrgencia || 1,
    precisaAte: initialData?.precisaAte || '',
    indicacaoClinica: initialData?.indicacaoClinica || '',
    contatoMedico: initialData?.contatoMedico || '',
    observacoes: initialData?.observacoes || ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        idHemocentro: initialData.idHemocentro || 0,
        nomePaciente: initialData.nomePaciente || '',
        tipoSanguineoPaciente: initialData.tipoSanguineoPaciente || '',
        idadePaciente: initialData.idadePaciente || 0,
        generoPaciente: initialData.generoPaciente || 'Masculino',
        numeroProntuario: initialData.numeroProntuario || '',
        diagnostico: initialData.diagnostico || '',
        tipoComponente: initialData.tipoComponente || '',
        quantidadeSolicitada: initialData.quantidadeSolicitada || 0,
        nivelUrgencia: initialData.nivelUrgencia || 1,
        precisaAte: initialData.precisaAte || '',
        indicacaoClinica: initialData.indicacaoClinica || '',
        contatoMedico: initialData.contatoMedico || '',
        observacoes: initialData.observacoes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {title.includes('Editar') ? 'Atualize as informações do pedido de transfusão' : 'Preencha todas as informações para solicitar a transfusão'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dados do Paciente */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dados do Paciente</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
              <div className="relative">
                <input
                  type="text"
                  name="nomePaciente"
                  value={formData.nomePaciente}
                  onChange={handleChange}
                  placeholder="Nome do paciente"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder:text-gray-400 outline-none"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo Sanguíneo</label>
                <div className="relative">
                  <select
                    name="tipoSanguineoPaciente"
                    value={formData.tipoSanguineoPaciente}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none placeholder:text-gray-400 outline-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    {tiposSanguineos.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Idade</label>
                <div className="relative">
                  <input
                    type="number"
                    name="idadePaciente"
                    value={formData.idadePaciente}
                    onChange={handleChange}
                    placeholder="Idade"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder:text-gray-400 outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gênero</label>
                <select
                  name="generoPaciente"
                  value={formData.generoPaciente}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none outline-none"
                  required
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Número do Prontuário</label>
                <input
                  type="text"
                  name="numeroProntuario"
                  value={formData.numeroProntuario}
                  onChange={handleChange}
                  placeholder="PR2024001234"
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados da Transfusão */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dados da Transfusão</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
              <input
                type="text"
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleChange}
                placeholder="Diagnóstico médico"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Componente</label>
                <select
                  name="tipoComponente"
                  value={formData.tipoComponente}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none outline-none"
                  required
                >
                  <option value="">Selecione...</option>
                  {tiposComponentes.map(componente => (
                    <option key={componente} value={componente}>{componente}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantidade (mL)</label>
                <input
                  type="number"
                  name="quantidadeSolicitada"
                  value={formData.quantidadeSolicitada}
                  onChange={handleChange}
                  placeholder="300"
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nível de Urgência</label>
                <input
                  type="number"
                  name="nivelUrgencia"
                  value={formData.nivelUrgencia}
                  onChange={handleChange}
                  placeholder="1-5"
                  min="1"
                  max="5"
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 outline-none"
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  1 = Baixa | 2 = Média | 3 = Alta | 4 = Crítica | 5 = Emergência
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precisa Até</label>
                <input
                  type="datetime-local"
                  name="precisaAte"
                  value={formData.precisaAte}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Indicação Clínica</label>
              <input
                type="text"
                name="indicacaoClinica"
                value={formData.indicacaoClinica}
                onChange={handleChange}
                placeholder="Ex: Cirurgia eletiva"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logística */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Logística</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Hemocentro</label>
              <select
                name="idHemocentro"
                value={formData.idHemocentro}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none outline-none"
                required
              >
                <option value="">Selecione...</option>
                {hemocentros.map((hemocentro: any) => (
                  <option key={hemocentro.id} value={hemocentro.id}>
                    {hemocentro.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contato do Médico</label>
              <input
                type="text"
                name="contatoMedico"
                value={formData.contatoMedico}
                onChange={handleChange}
                placeholder="Dr. João Santos"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Informações Adicionais</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Observações importantes sobre o pedido"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 placeholder-gray-400 resize-none outline-none"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-gray-200 bg-gray-50 -mx-8 px-8 py-6">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Importante:</span> Todos os campos marcados são obrigatórios
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormData({
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
                contatoMedico: '',
                observacoes: ''
              })}
              className="px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Limpar Formulário
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-8 py-3 bg-primary text-white hover:bg-primary-dark transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8c0 2.21-1.79 4-4 4s-4-1.79-4-4z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Pedido
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
