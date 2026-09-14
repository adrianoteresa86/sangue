import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Clock } from 'lucide-react';
import api from '../../services/api';

export const DoadorHemocentros: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: hemocentrosData, isLoading, error } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const filteredHemocentros = hemocentrosData?.filter((hc: any) =>
    hc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hc.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hc.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('doador.hemocentros.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">{t('doador.hemocentros.subtitle')}</p>
      </div>

      {/* Campo de Busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('doador.hemocentros.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">{t('doador.hemocentros.loading')}</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-primary-intense">{t('doador.hemocentros.error_load')}</p>
        </div>
      )}

      {/* Lista de Hemocentros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHemocentros.map((hc: any) => (
          <Card key={hc.id} title={hc.nome} description={`${hc.endereco}, ${hc.cidade || ''}`}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{hc.endereco}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{hc.telefone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{hc.horarioFuncionamento}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate(`/doador/agendar?hemocentro=${hc.id}`)}
              >
                {t('doador.hemocentros.schedule_button')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
