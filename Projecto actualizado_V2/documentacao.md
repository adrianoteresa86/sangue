# Documentação Completa do Sistema DoarFazBem (V2)

## 1. Visão Geral do Sistema
O **DoarFazBem** é um sistema completo de gestão de doação de sangue e pedidos de transfusão. Ele conecta hemocentros, doadores, receptores e profissionais de saúde, centralizando o estoque de sangue, agendamentos, campanhas de doação e requisições hospitalares numa plataforma única, responsiva e em tempo real.

O sistema opera com um modelo de múltiplos perfis de acesso, onde as informações são filtradas e geridas consoante o nível de autorização do utilizador.

## 2. Perfis de Utilizador e Funcionalidades

### 2.1. Administrador (ADMIN)
*   **Gestão Global:** Tem acesso total a todos os dados do sistema em todas as unidades.
*   **Gestão de Hemocentros:** Criação, edição e remoção de hemocentros.
*   **Gestão de Usuários:** Criação, edição e bloqueio de contas de todos os níveis (incluindo atribuir funcionários a hemocentros específicos).
*   **Visão Central de Estoque:** Visualiza o estoque de sangue de toda a rede.
*   **Campanhas:** Criar e aprovar campanhas de doação de sangue globais.
*   **Relatórios:** Visualização de todos os Agendamentos e Pedidos de Transfusão de toda a rede.

### 2.2. Coordenador de Hemocentro (COORDENADOR_HEMOCENTRO)
*   **Gestão Local:** Tem acesso gerencial restrito ao seu Hemocentro específico.
*   **Gestão de Equipa:** Pode visualizar e gerir os Técnicos e as informações associadas ao seu hemocentro.
*   **Estoque e Relatórios:** Monitoriza o nível de bolsas de sangue locais, gerindo o que entra e o que sai.
*   **Aprovação:** Aprova/rejeita pedidos de transfusão direcionados ao seu hemocentro e gere os agendamentos dos doadores.

### 2.3. Técnico de Hemocentro (TECNICO_HEMOCENTRO)
*   **Operação Local:** Actua no dia a dia do hemocentro a que está vinculado.
*   **Registo de Doações:** Processa as doações reais, regista as bolsas recolhidas (validando o tipo sanguíneo, quantidade, etc.) para que constem no estoque.
*   **Atendimento:** Gere o fluxo diário de agendamentos e dá andamento aos pedidos de transfusão pendentes.

### 2.4. Doador (DOADOR)
*   **Agendamentos:** Pode marcar uma doação de sangue escolhendo o Hemocentro, dia e horário.
*   **Histórico:** Acompanha todo o seu histórico de doações e as quantidades doadas.
*   **Campanhas:** Pode inscrever-se e visualizar campanhas activas de incentivo à doação.
*   **Notificações:** Recebe avisos quando o seu tipo de sangue está em falta no estoque público.

### 2.5. Receptor (RECEPTOR / Instituição de Saúde)
*   **Pedidos de Transfusão:** Pode solicitar bolsas de sangue a um hemocentro específico (indicando tipo, quantidade, urgência e paciente).
*   **Acompanhamento:** Verifica em tempo real se o seu pedido foi aprovado, rejeitado, ou se já está em andamento.

---

## 3. Tecnologias Utilizadas (Stack V2)

### 3.1. Backend (API REST)
A API foi desenhada para operar num ambiente Serverless moderno (via Vercel).
*   **Linguagem:** Node.js com TypeScript
*   **Framework Web:** Express.js
*   **ORM e Base de Dados:** TypeORM conectando a uma base de dados **PostgreSQL** (via Supabase).
*   **Segurança:** 
    *   `bcryptjs` para encriptação de senhas.
    *   `jsonwebtoken` (JWT) para controlo de sessões e autenticação.
    *   `express-rate-limit` para protecção contra ataques DDoS/Brute Force.
*   **Outros:** Multer (para upload de ficheiros/avatares), Nodemailer (envio de emails), e Swagger (documentação da API).

### 3.2. Frontend (SPA)
A interface foi reconstruída para ser uma Single Page Application extremamente rápida e interactiva.
*   **Biblioteca Core:** React.js (v19) com TypeScript
*   **Build Tool:** Vite.js
*   **Roteamento:** React Router DOM (v7)
*   **Estilização:** Tailwind CSS (v4) com suporte nativo a utilitários rápidos.
*   **Gestão de Estado de API:** `@tanstack/react-query` para caching agressivo e re-validação de dados em tempo real.
*   **Formulários e Validação:** `react-hook-form` aliado ao `zod` para garantir segurança nos inputs do lado do cliente.
*   **Internacionalização:** `i18next` com detecção de idioma no browser.
*   **Componentes Visuais:** `lucide-react` para ícones modernos e `sonner` para notificações visuais elegantes (Toasts).

---

## 4. Estrutura de Páginas e Comentários do Sistema

Abaixo encontra-se a análise (comentários de auditoria) sobre cada estrutura visual de página que compõe o sistema Frontend:

### 4.1. Páginas Públicas (Sem Autenticação)
*   `/` (Landing Page): A porta de entrada do sistema. Apresenta de forma apelativa o propósito do DoarFazBem e as métricas do impacto (quantas vidas foram salvas, litros doados). **Comentário:** Design fluído e focado em converter o visitante em doador, com *call-to-actions* directos.
*   `/login`: Tela de acesso ao sistema. Baseia-se no JWT fornecido pelo backend para determinar qual Layout (Admin, Doador, Receptor) carregar. **Comentário:** Utiliza segurança avançada Zod e encaminha o perfil coordenador/técnico correctamente para o `/admin` sem interrupções.
*   `/register`: Formulário duplo (permite registar como Doador ou como Receptor/Instituição).
*   `/estoque-publico`: Um ecrã público e vital onde a sociedade pode consultar que tipos de sangue estão em níveis críticos.

### 4.2. Painel Administrativo, Coordenador e Técnico (`/admin/*`)
Este é o core operacional (AdminLayout). Graças às novas regras dinâmicas da V2, este painel adapta-se dependendo se quem está logado é ADMIN, Coordenador ou Técnico.

*   `/admin` (Dashboard): O painel central. **Comentário:** Fornece métricas imediatas (total de doadores, litros doados, etc.) e gráficos de distribuição por tipo sanguíneo. Para o Técnico/Coordenador, apresenta dados *apenas* do seu hemocentro.
*   `/admin/estoque`: Gestão do inventário de bolsas de sangue. **Comentário:** Permite que os técnicos visualizem alertas de bolsas prestes a caducar e deem baixa ou saída conforme requisições.
*   `/admin/agendamentos`: Uma view com formato de lista ou calendário para processar os doadores marcados para o dia. **Comentário:** Essencial para a triagem e fluidez do atendimento no Hemocentro. O status pode ser mudado para 'Concluído' quando a pessoa doa o sangue.
*   `/admin/doadores`: Lista de todos os benfeitores do sistema.
*   `/admin/pedidos-transfusao`: View crítica onde os hospitais (Receptores) solicitam as bolsas. **Comentário:** O fluxo de "Pendente -> Aprovado -> Em Andamento -> Concluído" acontece aqui, centralizando a logística de vida ou morte.
*   `/admin/hemocentros`: Exclusivo do ADMIN. Serve para criar as sucursais e entidades parceiras. **Comentário:** Modernizado na V2 para permitir a visualização cruzada dos funcionários que gerem cada hemocentro (Pop-up de utilizadores) e exclusão segura.
*   `/admin/usuarios`: Exclusivo de ADMIN/COORDENADOR. Gestão de recursos humanos e criação de contas de acesso operacionais. **Comentário:** Incorpora um sistema complexo de restrição que previne a exclusão insegura (foreign key constrains) ao utilizar Soft Deletes.
*   `/admin/campanhas` e `/admin/notificacoes`: Geradores de tráfego e alertas da aplicação.

### 4.3. Painel do Doador (`/doador/*`)
*   `/doador`: Dashboard focado no indivíduo (próxima doação possível, total doado).
*   `/doador/agendar`: O coração do UX do doador. **Comentário:** Uma jornada passo a passo onde ele seleciona o hemocentro num mapa/lista, escolhe a data e confirma, tudo de forma assíncrona com `react-query`.
*   `/doador/historico`: Timeline visual (passado). Cria um sentimento de recompensa (gamification).
*   `/doador/campanhas`: Lista de urgências apelativas.

### 4.4. Painel do Receptor (`/receptor/*`)
*   `/receptor`: Dashboard do centro clínico. Indica quantos pedidos estão pendentes/aprovados.
*   `/receptor/transfusao`: O formulário de requisição oficial, requer dados rigorosos do paciente, grupo sanguíneo necessário, nível de urgência e número de unidades. **Comentário:** View de extrema responsabilidade.
*   `/receptor/requisicoes` e `/receptor/historico`: Tabelas detalhadas para rastreio logístico de onde vem o sangue.

## 5. Resumo da V2
Todo o sistema DoarFazBem (V2) constitui hoje uma arquitectura profissional. Ao centralizar as pastas num "Monorepo Workspace", estabilizamos o pipeline de deploy (Vercel CI/CD), isolámos as dependências (TypeORM + Express Serverless), garantindo que as regras de negócios e a renderização rápida do React coexistam de forma segura e perfeitamente controlada. A nível visual, as views cumprem um papel ergonómico reduzindo o risco de erro humano nos hemocentros.
