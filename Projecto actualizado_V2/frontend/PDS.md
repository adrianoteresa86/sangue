# PDS do Projeto Doar Faz Bem - Frontend

## 1. Visão Geral do Projeto

Este documento mapeia todas as funcionalidades, a organização do projeto e a arquitetura do frontend do sistema de gestão de doações de sangue. A aplicação é uma interface web moderna em React + TypeScript, consumindo um backend REST para gerenciar usuários, doadores, campanhas, hemocentros, estoque e transfusões.

## 2. Objetivo

Fornecer uma aplicação que suporte três perfis principais:
- Administrador
- Doador
- Receptor

Além de páginas públicas que apresentam informações institucionais, contato, landing page e acesso ao login/registro.

## 3. Tecnologias Usadas

- **Vite**: ferramenta de build rápida e moderna.
- **React 19**: biblioteca principal de UI.
- **TypeScript**: tipagem estática e robustez.
- **Tailwind CSS 4**: estilo utilitário e design responsivo.
- **React Router DOM 7**: roteamento do lado cliente.
- **React Query (TanStack)**: gerenciamento de dados assíncronos, cache e sincronização com a API.
- **Axios**: cliente HTTP para chamadas à API.
- **React Hook Form**: controle de formulários e validação.
- **Zod**: schemas e validação de dados.
- **i18next / react-i18next**: internacionalização com suporte a português e inglês.
- **Lucide-react**: ícones SVG.
- **Sonner**: notificações toast.

## 4. Estrutura de Pastas

```
src/
├── assets/               # Imagens, ícones e arquivos estáticos usados no app
├── components/           # Componentes reutilizáveis e específicos de layout
│   ├── admin/            # Componentes de administração, modais e formulários
│   ├── common/           # Componentes de formulário e UI genéricos
│   └── layouts/          # Componentes de proteção de rotas e wrappers
├── contexts/             # Contextos React, especialmente autenticação
├── hooks/                # Hooks customizados para API e comportamentos reutilizáveis
├── i18n/                 # Configuração de internacionalização
├── layouts/              # Layouts de páginas por tipo de usuário
├── locales/              # Arquivos de tradução JSON
├── pages/                # Páginas principais e páginas por perfil
├── services/             # Serviços HTTP e instância do Axios
└── types/                # Tipos TypeScript globais
```

## 5. Descrição de Cada Pasta e Arquivo Importante

### `src/main.tsx`
- Ponto de entrada da aplicação.
- Renderiza o `App` dentro do `React.StrictMode`.
- Inicializa o `BrowserRouter` e possivelmente outros providers.

### `src/App.tsx`
- Componente raiz que define as rotas e a estrutura de navegação.
- Integra `React Router` e `ProtectedRoute` para restringir páginas privadas.
- Define acesso condicional por tipo de usuário (admin, doador, receptor, público).

### `src/services/api.ts`
- Cria a instância do Axios com base em `VITE_API_URL`.
- Configura interceptors para adicionar token e tratar erros.
- Serve como ponto central de chamadas HTTP para todo o frontend.

### `src/contexts/AuthContext.tsx`
- Gerencia estado de autenticação global.
- Provê dados do usuário, token e ações de login/logout.
- Possibilita proteção de rotas com `ProtectedRoute`.

### `src/hooks/useApi.ts`
- Hook customizado para integração com a API.
- Provavelmente usa Axios e React Query internamente.
- Centraliza lógica de fetch, mutations e cache.

### `src/i18n/config.ts`
- Configuração do i18next para carregar traduções.
- Detecta idioma do navegador e permite trocar entre `pt` e `en`.

### `src/locales/pt.json` e `src/locales/en.json`
- Arquivos de tradução para português e inglês.
- Contêm as chaves textuais usadas pela UI.

### `src/components/common/`
- Componentes UI reutilizáveis:
  - `Button.tsx`: botões estilizados com variantes e estados.
  - `Card.tsx`: container de conteúdo com borda e sombra.
  - `DateInput.tsx`: campo de data.
  - `Input.tsx`: campo de texto com label, erro e helper.
  - `Select.tsx`: dropdown estilizado.

### `src/components/layouts/ProtectedRoute.tsx`
- Componente de rota protegida.
- Redireciona usuários não autenticados para login.
- Verifica permissões de perfil quando necessário.

### `src/components/admin/`
- Contém modais e formulários específicos para administração:
  - `HistoricoModal.tsx`
  - `TriagemModal.tsx`
  - `TriagemTransfusaoModal.tsx`
- `forms/` com formulários específicos de criação/edição:
  - `AgendamentoForm.tsx`
  - `CampanhaForm.tsx`
  - `EstoqueSangueForm.tsx`
  - `HemocentroForm.tsx`
  - `PedidoTransfusaoForm.tsx`
  - `PedidoTransfusaoFormSimple.tsx`
  - `PerfilDoadorForm.tsx`
  - `UsuarioForm.tsx`

### `src/layouts/`
- Layouts principais que organizam páginas por perfil:
  - `MainLayout.tsx`: layout base com header, footer e conteúdo.
  - `admin/AdminLayout.tsx`: dashboard admin com menus laterais.
  - `doador/DoadorLayout.tsx`: área para doadores.
  - `receptor/ReceptorLayout.tsx`: área para receptores.

### `src/pages/`
- Páginas públicas:
  - `Landing.tsx`: home page pública.
  - `Contacto.tsx`: contato.
  - `EstoquePublico.tsx`: estoque público de sangue.
  - `Sobre.tsx`: informações do projeto.
  - `Login.tsx`: tela de login.
  - `Register.tsx`: tela de registro.

- Páginas administrativas:
  - `admin/Agendamentos.tsx`
  - `admin/Campanhas.tsx`
  - `admin/Dashboard.tsx`
  - `admin/Doadores.tsx`
  - `admin/Estoque.tsx`
  - `admin/Hemocentros.tsx`
  - `admin/Notificacoes.tsx`
  - `admin/PedidosTransfusao.tsx`
  - `admin/Usuarios.tsx`

- Páginas do perfil do doador:
  - `doador/Agendar.tsx`
  - `doador/Campanhas.tsx`
  - `doador/Dashboard.tsx`
  - `doador/Hemocentros.tsx`
  - `doador/Historico.tsx`
  - `doador/Notificacoes.tsx`
  - `doador/Perfil.tsx`

- Páginas do perfil do receptor:
  - `receptor/Dashboard.tsx`
  - `receptor/Hemocentros.tsx`
  - `receptor/Historico.tsx`
  - `receptor/Notificacoes.tsx`
  - `receptor/PedidoDetalhe.tsx`
  - `receptor/Perfil.tsx`
  - `receptor/Requisicoes.tsx`
  - `receptor/Transfusao.tsx`

## 6. Funcionalidades Principais

### 6.1 Autenticação e Autorização
- Login de usuário com token JWT.
- Registro de novos usuários.
- Persistência de sessão local (provavelmente `localStorage`).
- Rotas privadas com verificação de perfil.
- Redirecionamento para telas adequadas por tipo de usuário.

### 6.2 Internacionalização
- Suporte a `pt` e `en`.
- Troca de idioma por meio de `LanguageSwitcher.tsx`.
- Traduções centralizadas em `src/locales`.

### 6.3 Navegação e Layout
- Navegação pública e privada em `App.tsx`.
- Layout específico por perfil para separar áreas de admin, doador e receptor.
- Barra de navegação pública e rodapé com informações de acesso.

### 6.4 Gestão de Dados e API
- Consumo de API via `axios`.
- Gerenciamento de fetch, cache e sincronização com `React Query`.
- Processamento de formulários com `React Hook Form` e validação com `Zod`.
- Uso de modais para ações rápidas de edição, triagem e detalhes.

### 6.5 Funcionalidades de Admin
- Dashboard com KPIs e gráficos/relações de dados.
- Gerenciamento de usuários, doadores e hemocentros.
- Criação e edição de campanhas.
- Visualização e controle do estoque de sangue.
- Acompanhamento de agendamentos e pedidos de transfusão.
- Notificações e histórico de atividades.

### 6.6 Funcionalidades de Doador
- Acesso ao próprio dashboard e histórico.
- Agenda de doações e consulta de campanhas.
- Visualização de hemocentros disponíveis.
- Atualização de perfil pessoal.
- Recebimento de notificações.

### 6.7 Funcionalidades de Receptor
- Acesso a dashboard com solicitações de sangue.
- Histórico de pedidos e transfusões.
- Visualização de hemocentros e disponibilidade.
- Detalhes de pedidos de transfusão.
- Atualização de perfil.

## 7. Fluxos de Uso

### Fluxo de Login
1. Usuário acessa `Login.tsx`.
2. Dados enviados para endpoint de autenticação.
3. Token é salvo e contexto de autenticação atualizado.
4. Usuário é redirecionado para o layout adequado.

### Fluxo de Registro
1. Usuário preenche formulário em `Register.tsx`.
2. Dados são validados com `Zod`.
3. Requisição é enviada ao backend.
4. Após registro, usuário pode ser redirecionado ao login.

### Fluxo de Agendamento de Doação
1. Doador acessa `doador/Agendar.tsx`.
2. Seleciona hemocentro, data e horário.
3. Submete o formulário.
4. Aplicação cria agendamento via API e atualiza o histórico.

### Fluxo de Gestão de Campanhas (Admin)
1. Admin acessa `admin/Campanhas.tsx`.
2. Visualiza lista de campanhas.
3. Pode abrir formulário `CampanhaForm.tsx` para criar ou editar.
4. Envia requisição para criar/atualizar backend.

## 8. Organização de Componentes

### Componentes Reutilizáveis
- Botões, inputs e selects genéricos são mantidos em `src/components/common`.
- Cards e wrappers visuais também ficam em `common`.

### Componentes de Administração
- Os componentes `admin` são usados para ações complexas como triagem, transfusão e histórico.
- Esses módulos contêm formulários especializados para as necessidades do painel administrativo.

### Layouts Específicos
- `MainLayout.tsx`: estrutura básica de header, nav e conteúdo.
- `AdminLayout.tsx`: barra lateral, menus e dashboard.
- `DoadorLayout.tsx` e `ReceptorLayout.tsx`: navegação interna especializada para cada perfil.

## 9. API e Integração

A aplicação se comunica com um backend REST. A URL base é configurada em `.env` via `VITE_API_URL`.

### Principais responsabilidades do backend
- Autenticação e geração de token.
- CRUD de usuários e perfis.
- Gestão de doadores, campanhas, hemocentros, estoque e transfusões.
- Notificações e histórico.

## 10. Observações Técnicas

- A tipagem TypeScript fornece segurança em formulários e chamadas API.
- `React Query` evita refetch manual e melhora performance com cache.
- `Tailwind CSS` garante layout responsivo e consistente.
- O uso de `i18next` facilita a expansão para mais idiomas.
- A arquitetura de componentes está organizada por domínio e por tipo de aplicação.

## 11. Recomendações de Evolução

- Adicionar testes unitários/integrados com `Vitest` ou `Jest`.
- Implementar autenticação mais robusta com refresh token.
- Criar componentes gráficos para dashboards (ex.: Recharts ou ApexCharts).
- Adicionar validação de formulários em múltiplos passos.
- Incluir suporte completo a acessibilidade (WCAG).

---

Este documento resume a organização do frontend, as funcionalidades mapeadas, a arquitetura e as tecnologias utilizadas. Ele serve como referência para entendimento rápido do projeto e futuras manutenções.