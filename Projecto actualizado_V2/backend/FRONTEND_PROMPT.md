# Prompt — Criar Frontend do DoarFazBem

## Contexto do Projecto

Cria o frontend completo da aplicação **DoarFazBem**, uma plataforma web de gestão de doações de sangue em Moçambique. O backend já existe em Node.js/TypeScript/Express e está documentado em Swagger em `http://localhost:8080/api/v1/docs`.

A aplicação tem **4 tipos de utilizadores** com experiências completamente diferentes:

| Perfil | Valor na API | Descrição |
|--------|-------------|-----------|
| Doador | `DONOR` | Doa sangue, agenda doações, recebe notificações |
| Receptor | `RECEIVER` | Faz pedidos de transfusão, acompanha estado |
| Hemocentro | `HEMOCENTER` | Gere estoque de sangue, confirma doações |
| Administrador | `ADMIN` | Acesso total ao sistema |

---

## Stack Tecnológica

- **Framework**: React 18+ com TypeScript
- **Routing**: React Router v6
- **Estado global**: Zustand (ou Redux Toolkit)
- **Requisições HTTP**: Axios com interceptores para o token JWT
- **Formulários**: React Hook Form + Zod para validação
- **UI**: Tailwind CSS + shadcn/ui (ou Chakra UI)
- **Gráficos**: Recharts (para o painel de estatísticas)
- **Notificações toast**: react-hot-toast (ou sonner)
- **Ícones**: Lucide React
- **Datas**: date-fns

---

## Autenticação

### Base URL
```
http://localhost:8080/api/v1
```

### Endpoints de autenticação
```
POST /auth/register          → Registo público (perfil DONOR ou RECEIVER)
POST /auth/admin/register    → Registo com token admin (qualquer perfil)
POST /auth/login             → Login com { identificador, senha }
POST /auth/oauth-login       → Login OAuth com { email, nome, provedor }
GET  /auth/validate          → Valida token e retorna { valido, idUsuario, email, perfil, tipoSangue }
```

### Fluxo de autenticação
1. Login devolve `{ token, idUsuario, email, perfil }` — guardar no localStorage e no estado global
2. Todas as rotas protegidas precisam do header: `Authorization: Bearer {token}`
3. Em caso de 401, redirecionar para `/login` e limpar o estado
4. Implementar interceptor Axios para injectar o token automaticamente em cada pedido

### Guard de rotas
- Rota pública: `/`, `/login`, `/register`, `/campanhas` (públicas)
- Rota autenticada: redireciona para login se não houver token
- Rota por perfil: redireciona para `/sem-permissao` se o perfil não for adequado

---

## Estrutura de Páginas

### Páginas Públicas (sem autenticação)

#### `/` — Página Inicial (Landing Page)
- Hero com slogan e call-to-action para registar/login
- Contador animado com estatísticas em tempo real (GET `/estatisticas/publicas`):
  - Total de doadores
  - Total de doações realizadas
  - Vidas salvas (= total de doações)
  - Taxa de sucesso
- Secção de campanhas activas (GET `/campanhas/activas`) — cards com título, hemocentro, datas, tipo sanguíneo alvo e barra de progresso (doacoesAtuais / metaDoacoes)
- Secção educativa: "Como funciona a doação?" (3 passos)
- Lista de hemocentros (GET `/hemocentros/activos`) com morada e horário
- Rodapé com contactos

#### `/login`
- Formulário: `identificador` (email ou telefone) + `senha`
- Botão de login com Google (chama `/auth/oauth-login`)
- Link para `/register`
- Após login, redirecionar para o dashboard do perfil correspondente

#### `/register`
- Formulário: nome, email, telefone, senha, confirmação de senha
- Selector de perfil: apenas DONOR ou RECEIVER disponíveis
- Ao submeter, conta fica inactiva até aprovação do admin (`ativo: false`)
- Mostrar mensagem: "Conta criada! Aguarda aprovação do administrador."

---

### Dashboard do Doador (`/doador/`)

> Perfil: `DONOR`

#### `/doador/inicio`
- Cartão de boas-vindas com nome e tipo sanguíneo
- Verificação se pode doar (GET `/agendamentos-doacao/pode-doar`):
  - Se `podeDoar: true` → botão "Agendar Doação"
  - Se `podeDoar: false` → mostrar `proximaDataDisponivel`
- Histórico resumido: últimas 3 doações (GET `/registros-doacao/meus`)
- Próximos agendamentos (GET `/agendamentos-doacao/meus/futuros`) — máx. 2
- Contador de notificações não lidas (GET `/notificacoes/minhas/contagem-nao-lidas`)

#### `/doador/perfil`
- Ver e editar o perfil de doador (GET / POST `/doadores/perfil`):
  - Tipo sanguíneo (obrigatório): A+, A-, B+, B-, O+, O-, AB+, AB-
  - Idade (18–65)
  - Peso (mín. 50kg)
- Dados da conta (nome, email, telefone)

#### `/doador/agendamentos`
- Separadores: "Futuros" / "Passados"
- Lista de agendamentos com data, hemocentro, status (badge colorido):
  - `PENDING` → Amarelo
  - `COMPLETED` → Verde
  - `CANCELLED` → Vermelho
- Botão "Cancelar" nos agendamentos pendentes (PATCH `/:id/cancelar`)
- Botão "Novo Agendamento"

#### `/doador/agendamentos/novo`
- Formulário de agendamento (POST `/agendamentos-doacao`):
  - Selecionar hemocentro (GET `/hemocentros/activos`) — dropdown
  - Data preferida (datepicker)
  - Hora preferida (input time)
  - Tipo sanguíneo (preenchido automaticamente do perfil)
  - Observações
  - Nome e telefone de contacto de emergência
  - Cidade
- Validação: só permite se `podeDoar: true`

#### `/doador/doacoes`
- Histórico completo das doações realizadas (GET `/registros-doacao/meus`)
- Card por doação: data, hemocentro, tipo sanguíneo, quantidade (ml), elegível (sim/não)
- Filtro por período

#### `/doador/notificacoes`
- Lista de notificações (GET `/notificacoes/minhas`)
- Separadores: "Todas" / "Não lidas"
- Botão "Marcar todas como lidas" (PATCH `/notificacoes/minhas/marcar-todas-lidas`)
- Ao clicar numa notificação, marcar como lida (PATCH `/:id/lida`)
- Badge com contagem de não lidas no ícone do sino no header

---

### Dashboard do Receptor (`/receptor/`)

> Perfil: `RECEIVER`

#### `/receptor/inicio`
- Resumo: pedidos activos, último pedido, campanhas relevantes

#### `/receptor/pedidos`
- Lista dos seus pedidos de transfusão — filtrar pelo `idReceptor`
- Status com badge colorido:
  - `PENDING` → Amarelo
  - `APPROVED` → Azul
  - `IN_PROGRESS` → Roxo
  - `COMPLETED` → Verde
  - `REJECTED` / `CANCELLED` → Vermelho

#### `/receptor/pedidos/novo`
- Formulário de pedido (POST `/pedidos-transfusao`):
  - Hemocentro (dropdown)
  - Nome do paciente, tipo sanguíneo, idade, género
  - Número de prontuário
  - Diagnóstico
  - Tipo de componente (Sangue Total, Plasma, Concentrado de Hemácias, Plaquetas)
  - Quantidade solicitada (nº de unidades)
  - Nível de urgência: 1=Baixa, 2=Média, 3=Alta, 4=Crítica (selector visual)
  - "Precisa até" (datepicker + hora)
  - Indicação clínica, contacto do médico, observações

#### `/receptor/notificacoes`
- Igual ao doador

---

### Dashboard do Hemocentro (`/hemocentro/`)

> Perfil: `HEMOCENTER`

#### `/hemocentro/inicio`
- Resumo do estoque por tipo sanguíneo (gráfico de barras)
- Unidades a vencer (GET `/estoque-sangue/vencendo-em-breve`) — alerta visual
- Agendamentos do dia
- Pedidos de transfusão pendentes

#### `/hemocentro/estoque`
- Tabela do estoque (GET `/estoque-sangue/hemocentro/:id`)
- Filtros: tipo sanguíneo, disponibilidade
- Acções por linha:
  - Editar (PUT `/:id`)
  - Marcar como indisponível (PATCH `/:id/indisponivel`)
  - Diminuir quantidade (PATCH `/:id/diminuir`) — modal com campo quantidade
  - Remover (DELETE `/:id`)
- Botão "Adicionar ao estoque"

#### `/hemocentro/estoque/novo`
- Formulário (POST `/estoque-sangue`):
  - Tipo sanguíneo, quantidade (ml), tipo de componente
  - Data de validade, data de recebimento

#### `/hemocentro/agendamentos`
- Lista de agendamentos do hemocentro (GET `/agendamentos-doacao/hemocentro/:id`)
- Filtro por status
- Acção: actualizar status (PATCH `/:id/status`) → PENDING / COMPLETED / CANCELLED

#### `/hemocentro/doacoes`
- Registar nova doação (POST `/registros-doacao`) com formulário clínico completo:
  - Selecionar doador (pesquisa por nome/email)
  - Dados vitais: hemoglobina, pressão sistólica/diastólica, pulso, temperatura, peso
  - Tipo sanguíneo, tipo de componente, quantidade (ml)
  - Elegibilidade (checkbox) + motivo de inelegibilidade se não for elegível
  - Observações, ID do técnico
- Lista de doações do hemocentro (GET `/registros-doacao/hemocentro/:id`)

#### `/hemocentro/transfusoes`
- Pedidos pendentes (GET `/pedidos-transfusao/pendentes`)
- Aprovar/rejeitar pedido (PATCH `/:id/status`)
- Registar transfusão realizada (POST `/registros-transfusao`):
  - Formulário com dados vitais pré/durante/pós transfusão
  - Selecionar unidade do estoque
  - Reacção adversa (toggle) + descrição
  - Complicações, observações

#### `/hemocentro/notificacoes`
- Igual ao doador

---

### Dashboard do Admin (`/admin/`)

> Perfil: `ADMIN`

#### `/admin/inicio` — Painel Principal
- Cards de métricas:
  - Total de utilizadores por perfil (GET `/estatisticas/painel`)
  - Total de doações / últimos 30 dias
  - Total de pedidos de transfusão / últimos 30 dias
  - Vidas salvas, taxa de sucesso
- Gráfico de linha: doações por mês nos últimos 12 meses
- Gráfico de pizza: utilizadores por perfil
- Lista de utilizadores pendentes de aprovação (GET `/admin/notificacoes/utilizadores/pendentes-aprovacao`)
  - Botões "Aprovar" (PUT `/:id/aprovar`) e "Rejeitar" (PUT `/:id/rejeitar`)

#### `/admin/utilizadores`
- Tabela com todos os utilizadores (GET `/usuarios`)
- Colunas: nome, email, telefone, perfil (badge), activo (toggle), data de criação
- Filtros: por perfil, por estado (activo/inactivo)
- Acções: editar (PUT `/:id`), eliminar (DELETE `/:id`)
- Botão "Novo utilizador" → abre modal com formulário completo (POST `/usuarios/adicionar`)

#### `/admin/hemocentros`
- Tabela de hemocentros (GET `/hemocentros`)
- Criar, editar, remover hemocentros (POST / PUT / DELETE `/hemocentros`)
- Card por hemocentro: nome, cidade, telefone, estado activo/inactivo

#### `/admin/campanhas`
- Tabela de campanhas (GET `/campanhas`)
- Barra de progresso: doacoesAtuais / metaDoacoes
- Criar, editar, remover campanhas
- Filtro: activas / todas

#### `/admin/estoque`
- Visão global do estoque de todos os hemocentros
- Agrupado por tipo sanguíneo
- Filtro por hemocentro

#### `/admin/doacoes`
- Tabela com todas as doações (GET `/registros-doacao`)
- Filtro por hemocentro, doador, período
- Ver detalhes, editar, remover

#### `/admin/agendamentos`
- Tabela com todos os agendamentos (GET `/agendamentos-doacao`)
- Actualizar status

#### `/admin/pedidos-transfusao`
- Tabela com todos os pedidos (GET `/pedidos-transfusao`)
- Urgência destacada visualmente (cor vermelha para nível 4)
- Aprovar / rejeitar / actualizar status

#### `/admin/transfusoes`
- Tabela com todos os registos de transfusão (GET `/registros-transfusao`)

#### `/admin/notificacoes`
- Ver todas as notificações (GET `/notificacoes`)
- Enviar notificação individual (POST `/admin/notificacoes`)
- Enviar em massa (POST `/admin/notificacoes/em-massa`) — selecção múltipla de destinatários
- Enviar alertas especializados:
  - Lembrete de doação (`/notificacoes/lembrete-doacao`)
  - Urgência de sangue (`/notificacoes/urgencia-sangue`) — seleccionar tipo sanguíneo e doadores compatíveis
  - Resultado de teste (`/notificacoes/resultado-teste`)
  - Confirmação de doação (`/notificacoes/doacao-confirmada`)
- Remover notificações expiradas (DELETE `/notificacoes/expiradas`)

---

## Componentes Partilhados

### Layout
- **Header** com logo "DoarFazBem", menu de navegação por perfil, ícone de sino (notificações) com badge, avatar do utilizador + dropdown (perfil / logout)
- **Sidebar** para dashboards (recolhível em mobile)
- **Footer** apenas nas páginas públicas

### Componentes UI reutilizáveis
- `StatusBadge` — badge colorido para status de doação/transfusão
- `BloodTypeBadge` — badge com tipo sanguíneo
- `UrgencyIndicator` — indicador visual 1–4 com cores
- `ProgressBar` — barra de progresso para campanhas
- `NotificationItem` — item de notificação com ícone por tipo
- `ConfirmDialog` — modal de confirmação para acções destrutivas
- `DataTable` — tabela com paginação, ordenação e filtros
- `StatsCard` — card de métrica com ícone e variação
- `EmptyState` — estado vazio com ilustração e CTA

### Tipos de notificação e ícones sugeridos
| Tipo | Ícone | Cor |
|------|-------|-----|
| `DONATION_REMINDER` | 🩸 Calendário | Azul |
| `DONATION_CONFIRMED` | ✅ Check | Verde |
| `DONATION_CANCELLED` | ❌ X | Vermelho |
| `BLOOD_URGENCY` | 🚨 Alerta | Vermelho |
| `CAMPAIGN_ANNOUNCEMENT` | 📢 Megafone | Laranja |
| `TRANSFUSION_REQUEST` | 💉 Seringa | Roxo |
| `TRANSFUSION_COMPLETED` | ✅ Check | Verde |
| `TEST_RESULTS_READY` | 🔬 Microscópio | Azul |
| `ADMIN_NOTIFICATION` | 👤 Utilizador | Cinzento |
| `APPOINTMENT_SCHEDULED` | 📅 Calendário | Verde |
| `SYSTEM_ALERT` | ⚠️ Triângulo | Amarelo |

---

## Considerações Técnicas

### Gestão de estado (Zustand)
```typescript
// auth store
{ token, user: { id, email, perfil, tipoSangue }, login(), logout() }

// notifications store
{ count: number, fetchCount() }
```

### Axios — configuração do cliente HTTP
```typescript
// Interceptor de request: injectar token
// Interceptor de response: em 401, logout e redirect para /login
```

### Variável de ambiente
```
VITE_API_URL=http://localhost:8080/api/v1
```

### Tratamento de erros
- Erros de validação (400): mostrar mensagem do campo junto ao input
- Não autorizado (401): redirecionar para login
- Proibido (403): mostrar página "Sem permissão"
- Não encontrado (404): mostrar componente de erro inline
- Erro do servidor (500): toast de erro genérico

### Responsividade
- Mobile-first
- Sidebar recolhe automaticamente em ecrãs < 768px
- Tabelas tornam-se cards empilhados em mobile

---

## Design e Identidade Visual

- **Nome da aplicação**: DoarFazBem
- **Paleta de cores**:
  - Primária: Vermelho sangue `#DC2626` (red-600)
  - Secundária: Vermelho escuro `#991B1B` (red-800)
  - Fundo: Branco e cinzento claro `#F9FAFB`
  - Sucesso: Verde `#16A34A`
  - Alerta: Amarelo `#CA8A04`
  - Perigo: Vermelho `#DC2626`
- **Tipografia**: Inter (Google Fonts)
- **Bordas**: arredondadas (`rounded-lg`)
- **Sombras**: suaves (`shadow-sm`)
- **Tom**: profissional, humano, de confiança — ligado à saúde e solidariedade

---

## Estrutura de Ficheiros Sugerida

```
src/
├── api/
│   ├── cliente.ts           # instância axios com interceptores
│   ├── auth.api.ts
│   ├── usuario.api.ts
│   ├── hemocentro.api.ts
│   ├── estoque.api.ts
│   ├── campanha.api.ts
│   ├── agendamento.api.ts
│   ├── doacao.api.ts
│   ├── pedido-transfusao.api.ts
│   ├── transfusao.api.ts
│   ├── notificacao.api.ts
│   └── estatisticas.api.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── ui/
│       ├── StatusBadge.tsx
│       ├── BloodTypeBadge.tsx
│       ├── DataTable.tsx
│       ├── StatsCard.tsx
│       ├── ConfirmDialog.tsx
│       └── ...
├── pages/
│   ├── publicas/
│   ├── auth/
│   ├── doador/
│   ├── receptor/
│   ├── hemocentro/
│   └── admin/
├── stores/
│   ├── auth.store.ts
│   └── notificacao.store.ts
├── types/
│   └── index.ts             # interfaces TypeScript para todas as entidades
├── hooks/
│   └── useNotificacoes.ts
└── utils/
    ├── formatadores.ts       # datas, tipos sanguíneos, status
    └── validacao.ts
```

---

## Ordem de Implementação Sugerida

1. Configurar projecto (Vite + React + TS + Tailwind + shadcn/ui)
2. Cliente HTTP (Axios) + tipos TypeScript das entidades
3. Páginas de autenticação (login, register) + auth store
4. Guards de rota por perfil
5. Layout partilhado (header, sidebar)
6. Dashboard do Doador (início → agendamento → histórico → notificações)
7. Dashboard do Hemocentro (estoque → agendamentos → doações → transfusões)
8. Dashboard do Admin (painel → utilizadores → campanhas → notificações)
9. Dashboard do Receptor (pedidos)
10. Páginas públicas (landing, campanhas, hemocentros)
11. Polimento: responsividade, estados vazios, loading skeletons, testes
