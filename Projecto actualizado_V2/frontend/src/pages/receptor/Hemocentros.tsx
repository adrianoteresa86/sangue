import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Building2, MapPin, Phone, Mail, Clock } from 'lucide-react';
import api from '../../services/api';
import type { HemocentroSimples } from '../../types';

interface HemocentroDetalhe extends HemocentroSimples {
  endereco?: string;
  telefone?: string;
  email?: string;
  horarioAbertura?: string;
  horarioFechamento?: string;
  provincia?: string;
  ativo?: boolean;
}

export const ReceptorHemocentros: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: hemocentros = [], isLoading, isError } = useQuery<HemocentroDetalhe[]>({
    queryKey: ['receptor-hemocentros'],
    queryFn: () => api.get('/receptor/hemocentros').then((r) => r.data),
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
        {t('receptor.hemocentros.error_load')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('receptor.hemocentros.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {hemocentros.length !== 1
              ? t('receptor.hemocentros.units_active_plural', { count: hemocentros.length })
              : t('receptor.hemocentros.units_active_single', { count: hemocentros.length })}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/receptor/transfusao')}>
          {t('receptor.hemocentros.request_button')}
        </Button>
      </div>

      {hemocentros.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-500">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">{t('receptor.hemocentros.empty_msg')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hemocentros.map((h) => (
            <Card key={h.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{h.nome}</h3>
                      {h.cidade && (
                        <p className="text-sm text-gray-500">{h.cidade}{h.provincia ? `, ${h.provincia}` : ''}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    {t('receptor.hemocentros.active_badge')}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-sm">
                  {h.endereco && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{h.endereco}</span>
                    </div>
                  )}
                  {h.telefone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 shrink-0" />
                      <a href={`tel:${h.telefone}`} className="hover:text-primary">
                        {h.telefone}
                      </a>
                    </div>
                  )}
                  {h.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 shrink-0" />
                      <a href={`mailto:${h.email}`} className="hover:text-primary truncate">
                        {h.email}
                      </a>
                    </div>
                  )}
                  {(h.horarioAbertura || h.horarioFechamento) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        {h.horarioAbertura ?? '?'} — {h.horarioFechamento ?? '?'}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigate(`/receptor/transfusao?hemocentro=${h.id}`)}
                >
                  {t('receptor.hemocentros.request_here')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
