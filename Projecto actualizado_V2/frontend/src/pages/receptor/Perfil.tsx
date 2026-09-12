import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { DateInput } from '../../components/common/DateInput';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import type { PerfilReceptorResponse } from '../../types';

export const ReceptorPerfil: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    provincia: '',
    dataNascimento: '',
    tipoSanguineo: '',
    peso: '',
    altura: '',
    historicoMedico: '',
    genero: '',
  });

  const { data: perfil, isLoading } = useQuery<PerfilReceptorResponse>({
    queryKey: ['receptor-perfil'],
    queryFn: () => api.get('/receptor/perfil').then((r) => r.data),
  });

  useEffect(() => {
    if (perfil) {
      setForm({
        nome: perfil.nome ?? '',
        email: perfil.email ?? '',
        telefone: perfil.telefone ?? '',
        rua: perfil.rua ?? '',
        numero: perfil.numero ?? '',
        bairro: perfil.bairro ?? '',
        provincia: perfil.provincia ?? '',
        dataNascimento: perfil.perfilMedico?.dataNascimento?.slice(0, 10) ?? '',
        tipoSanguineo: perfil.perfilMedico?.tipoSanguineo ?? '',
        peso: perfil.perfilMedico?.peso != null ? String(perfil.perfilMedico.peso) : '',
        altura: perfil.perfilMedico?.altura != null ? String(perfil.perfilMedico.altura) : '',
        historicoMedico: perfil.perfilMedico?.historicoMedico ?? '',
        genero: perfil.perfilMedico?.genero ?? '',
      });
    }
  }, [perfil]);

  const atualizarMutation = useMutation({
    mutationFn: (dados: object) => api.put('/receptor/perfil', dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptor-perfil'] });
      setSucesso(true);
      setErro('');
      setTimeout(() => setSucesso(false), 3000);
    },
    onError: (error: any) => {
      setErro(error.response?.data?.erro ?? t('receptor.perfil.error_save'));
      setSucesso(false);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarMutation.mutate({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      rua: form.rua,
      numero: form.numero,
      bairro: form.bairro,
      provincia: form.provincia,
      dataNascimento: form.dataNascimento || undefined,
      tipoSanguineo: form.tipoSanguineo || undefined,
      peso: form.peso ? Number(form.peso) : undefined,
      altura: form.altura ? Number(form.altura) : undefined,
      historicoMedico: form.historicoMedico || undefined,
      genero: form.genero || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('receptor.perfil.title')}</h1>
        <p className="text-gray-600 mt-1">{t('receptor.perfil.subtitle')}</p>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm font-medium">
          {t('receptor.perfil.success')}
        </div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card title={t('receptor.perfil.personal_data')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t('receptor.perfil.full_name')} name="nome" value={form.nome} onChange={handleChange} />
            <Input label={t('receptor.perfil.email')} type="email" name="email" value={form.email} onChange={handleChange} />
            <Input label={t('receptor.perfil.phone')} name="telefone" value={form.telefone} onChange={handleChange} />
            <DateInput label={t('receptor.perfil.birth_date')} name="dataNascimento" value={form.dataNascimento} onChange={handleChange} />
          </div>
        </Card>

        {/* Endereço */}
        <Card title={t('receptor.perfil.address')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t('receptor.perfil.street')} name="rua" value={form.rua} onChange={handleChange} />
            <Input label={t('receptor.perfil.number')} name="numero" value={form.numero} onChange={handleChange} />
            <Input label={t('receptor.perfil.neighborhood')} name="bairro" value={form.bairro} onChange={handleChange} />
            <Input label={t('receptor.perfil.province')} name="provincia" value={form.provincia} onChange={handleChange} />
          </div>
        </Card>

        {/* Dados Médicos */}
        <Card title={t('receptor.perfil.medical_data')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.perfil.blood_type')}</label>
              <select
                name="tipoSanguineo"
                value={form.tipoSanguineo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('receptor.perfil.blood_select')}</option>
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((tp) => (
                  <option key={tp}>{tp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.perfil.gender')}</label>
              <select
                name="genero"
                value={form.genero}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('receptor.perfil.gender_select')}</option>
                <option value="M">{t('receptor.perfil.gender_male')}</option>
                <option value="F">{t('receptor.perfil.gender_female')}</option>
                <option value="Outro">{t('receptor.perfil.gender_other')}</option>
              </select>
            </div>

            <Input label={t('receptor.perfil.weight')} name="peso" type="number" value={form.peso} onChange={handleChange} placeholder={t('receptor.perfil.weight_placeholder')} />
            <Input label={t('receptor.perfil.height')} name="altura" type="number" value={form.altura} onChange={handleChange} placeholder={t('receptor.perfil.height_placeholder')} />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.perfil.medical_history')}</label>
            <textarea
              name="historicoMedico"
              value={form.historicoMedico}
              onChange={handleChange}
              placeholder={t('receptor.perfil.medical_history_placeholder')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        <Button
          variant="primary"
          type="submit"
          className="w-full"
          loading={atualizarMutation.isPending}
        >
          {atualizarMutation.isPending ? t('receptor.perfil.saving') : t('receptor.perfil.save_button')}
        </Button>
      </form>
    </div>
  );
};
