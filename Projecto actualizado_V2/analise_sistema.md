# Análise Completa do Sistema - DoarFazBem

## Visão Geral
O sistema **DoarFazBem** é uma plataforma inovadora criada para otimizar e conectar doadores de sangue e instituições de saúde (hemocentros e hospitais). A arquitetura é dividida em dois eixos principais: um backend robusto responsável pelas lógicas de negócio e banco de dados, e um frontend altamente responsivo e interativo para a interface com os vários perfis de usuários.

## Perfis de Usuário e Funções
O sistema conta com três perfis principais:
1. **Doador**:
   - Cadastro e gerenciamento de perfil e tipo sanguíneo.
   - Acesso a um histórico de doações passadas e pendentes.
   - Inscrição em campanhas de doação de sangue.
   - Solicitações e acompanhamento de doações voluntárias em diferentes hemocentros.
   - Visualização de estatísticas sobre vidas salvas e volume doado.

2. **Receptor (Instituições de Saúde)**:
   - Criação de requisições e pedidos de transfusão com especificações de volume, tipo sanguíneo e urgência.
   - Acompanhamento do histórico de solicitações e do processamento dos pedidos.
   - Interação simplificada para recebimento do sangue solicitado dos hemocentros.

3. **Administrador / Hemocentro**:
   - Visão panorâmica sobre as doações, estoque de sangue e solicitações.
   - Dashboard com KPIs (Indicadores Chave de Desempenho) detalhados, como doações mensais e tipos sanguíneos mais escassos.
   - Gestão ativa de campanhas de doação (criação, aprovação e monitoramento).
   - Validação e processamento de pedidos de transfusão e agendamentos.
   - Controle total do estoque de bolsas de sangue.
   - Relatórios em PDF e Excel para aprimorar tomadas de decisões.

## Tecnologias Utilizadas

### Frontend
- **React.js**: Biblioteca base para a construção das interfaces, garantindo componentes reutilizáveis.
- **TypeScript**: Superset de JavaScript usado para garantir a tipagem estática e reduzir erros de desenvolvimento.
- **Tailwind CSS**: Framework utilitário de CSS usado para rápida customização e garantia de uma UI 100% responsiva (Mobile First) e padronizada, com foco em uma navegação agradável através de um menu "hamburger" para dispositivos móveis e tabelas responsivas.
- **Vite**: Ferramenta de *build* super rápida para React.
- **React Router**: Para o roteamento no cliente e navegação SPA (Single Page Application).
- **React Query (TanStack Query)**: Gerenciamento de estado remoto e requisições para a API.
- **Axios**: Cliente HTTP para comunicação com o backend.
- **Lucide React**: Biblioteca de ícones vetorizados para interfaces modernas.
- **i18next**: Internacionalização do sistema, permitindo suporte a diferentes idiomas.

### Backend
- **Node.js & Express**: Frameworks para o servidor da aplicação. Oferecem uma estrutura sólida para lidar com solicitações HTTP.
- **TypeScript**: Assegurando a robustez da API e o alinhamento das tipagens entre cliente e servidor.
- **TypeORM**: ORM (Object-Relational Mapping) utilizado para facilitar a manipulação e o mapeamento dos dados na base de dados relacional.
- **PostgreSQL**: Banco de dados relacional principal da aplicação para garantir consistência e performance.
- **JWT (JSON Web Tokens)**: Usado para autenticação segura e autorização nas rotas da API.

## Estrutura de Páginas e Componentes

### Componentes Base
- **DataTableToolbar**: Componente central, inserido em todas as páginas com tabelas (Agendamentos, Campanhas, Usuários, etc). Oferece recursos como: busca em tempo real, filtragem inteligente de status/tipos, e exportação para Excel, essencial para análise de dados do lado dos administradores.
- **Layouts**: Estrutura de navegação (Header, Sidebar) separada por roles (`AdminLayout`, `DoadorLayout`, `ReceptorLayout`) para manter a lógica de segurança e exibição.
- **Modais e Formulários**: Utilizam designs modernos e responsivos (como animações sutis, botões flexíveis e tipografia padronizada).

### Telas
- **Dashboard (`/admin/dashboard`, `/doador/dashboard`, `/receptor/dashboard`)**: Cada perfil possui uma página inicial com métricas, contadores rápidos (Total, Pendentes) e informações de alto nível, utilizando o componente genérico `Card`.
- **Historicos & Tabelas (`Agendamentos`, `Campanhas`, `Estoque`)**: Tabelas paginadas com limite de 10 itens por vez (personalizável até 1000). A implementação das listas garante legibilidade através da propriedade `overflow-x-auto` no Tailwind, que resolve a sobreposição em telas mobile.
- **Autenticação**: Telas limpas e com validação baseada em estado local. O JWT é salvo de forma segura no lado do cliente.

## Considerações sobre as Últimas Atualizações
- **Interface e UX**: Todas as páginas que lidam com listas (mais de 10 itens) receberam o recurso avançado de filtragem.
- **Design Clean e Responsivo**: A usabilidade foi posta no centro através da melhoria das quebras de layout nas páginas para dispositivos como tablets e telemóveis. Modificações em classes `flex` asseguram que inputs de busca não fiquem escondidos nem excedam o tamanho da tela.
- **Deploy Otimizado**: A arquitetura do repositório foi readaptada para suportar deploy da raiz (Root) pela Vercel, possibilitando que as Serverless Functions (`/api`) exponham a base de dados em perfeita sincronia com o Frontend.

## Conclusão
O *DoarFazBem* surge como uma ferramenta escalável, segura e visualmente amigável para resolver os desafios de logística sanguínea, empregando o que há de mais moderno em design de sistemas web atuais.
