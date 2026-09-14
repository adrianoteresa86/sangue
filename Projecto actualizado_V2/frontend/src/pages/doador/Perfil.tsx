import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const PROVINCIAS_ANGOLA = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
  'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
  'Namibe', 'Uíge', 'Zaire',
];

export const DoadorPerfil: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: me, isLoading: loadingPerfil } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((res) => res.data),
  });

  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const get = (key: string, fallback: string) =>
    key in overrides ? overrides[key] : fallback;

  const formData = {
    nome:      get('nome',     me?.nome || ''),
    email:     get('email',    me?.email || ''),
    phone:     get('phone',    me?.telefone || ''),
    rua:       get('rua',      me?.rua || ''),
    numero:    get('numero',   me?.numero || ''),
    bairro:    get('bairro',   me?.bairro || ''),
    provincia: get('provincia',me?.provincia || ''),
    idade:     get('idade',    me?.perfilDoador?.idade?.toString() || ''),
    sangue:    get('sangue',   me?.perfilDoador?.tipoSangue || ''),
    peso:      get('peso',     me?.perfilDoador?.peso?.toString() || ''),
    genero:    get('genero',   me?.perfilDoador?.genero || ''),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOverrides(prev => ({ ...prev, [name]: value }));
  };

  const updatePerfilMutation = useMutation({
    mutationFn: (data: Record<string, string | number>) => api.put('/doadores/meu-perfil', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: Record<string, string | number> = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.phone,
      rua: formData.rua,
      numero: formData.numero,
      bairro: formData.bairro,
      provincia: formData.provincia,
    };
    if (formData.sangue) payload.tipoSangue = formData.sangue;
    if (formData.idade) payload.idade = Number(formData.idade);
    if (formData.peso) payload.peso = Number(formData.peso);
    if (formData.genero) payload.genero = formData.genero;

    try {
      await updatePerfilMutation.mutateAsync(payload);
      toast.success(t('doador.perfil.success'));
    } catch {
      toast.error(t('doador.perfil.error_save'));
    }
  };

  if (loadingPerfil) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('doador.perfil.title')}</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">{t('doador.perfil.loading')}</p>
        </div>
      </div>
    );
  }

  const isPending = updatePerfilMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('doador.perfil.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">{t('doador.perfil.subtitle')}</p>
      </div>

<form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card title={t('doador.perfil.personal_data')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t('doador.perfil.full_name')} name="nome" value={formData.nome} onChange={handleChange} />
            <Input label={t('doador.perfil.email')} type="email" name="email" value={formData.email} onChange={handleChange} />
            <Input label={t('doador.perfil.phone')} name="phone" value={formData.phone} onChange={handleChange} />
          </div>
        </Card>

        {/* Dados de Saúde */}
        <Card title={t('doador.perfil.health_data')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('doador.perfil.gender')}</label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('doador.perfil.gender_unspecified')}</option>
                <option value="MASCULINO">{t('doador.perfil.gender_male')}</option>
                <option value="FEMININO">{t('doador.perfil.gender_female')}</option>
              </select>
            </div>

            <Input
              label={t('doador.perfil.age')}
              name="idade"
              type="number"
              min="18"
              max="65"
              value={formData.idade}
              onChange={handleChange}
              placeholder={t('doador.perfil.age_placeholder')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('doador.perfil.blood_type')}</label>
              <select
                name="sangue"
                value={formData.sangue}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('doador.perfil.blood_select')}</option>
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(tp => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </select>
            </div>

            <Input
              label={t('doador.perfil.weight')}
              name="peso"
              type="number"
              step="0.1"
              min="50"
              value={formData.peso}
              onChange={handleChange}
              placeholder={t('doador.perfil.weight_placeholder')}
            />
          </div>
        </Card>

        {/* Endereço */}
        <Card title={t('doador.perfil.address')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t('doador.perfil.street')} name="rua" value={formData.rua} onChange={handleChange} />
            <Input label={t('doador.perfil.number')} name="numero" value={formData.numero} onChange={handleChange} />
            <Input label={t('doador.perfil.neighborhood')} name="bairro" value={formData.bairro} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('doador.perfil.province')}</label>
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione a província</option>
                {PROVINCIAS_ANGOLA.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Button variant="primary" type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('doador.perfil.saving') : t('common.save')}
        </Button>
      </form>
    </div>
  );
};
