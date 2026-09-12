import api from '../services/api';
import { DOADOR_UNIVERSAL, RECEPTOR_UNIVERSAL, RECEBE_DE, doaPara } from './compatibilidade';
import type { AccaoBot, ContextoConversa, Intencao, PerfilUsuario, RespostaBot } from './tipos';

// ---------------------------------------------------------------------------
// Navegação — cada perfil só tem acesso às suas próprias rotas (ver App.tsx).
// Quando não existe rota para o perfil actual, a acção é simplesmente omitida.
// ---------------------------------------------------------------------------

const PUBLICO = 'PUBLICO';

type ChaveRota =
  | 'agendar'
  | 'hemocentros'
  | 'campanhas'
  | 'estoque'
  | 'pedidos'
  | 'historico'
  | 'notificacoes'
  | 'contacto'
  | 'registar'
  | 'login'
  | 'sobre';

const ROTAS: Record<ChaveRota, Partial<Record<string, string>>> = {
  agendar: { PUBLICO: '/register', DOADOR: '/doador/agendar', ADMIN: '/admin/agendamentos' },
  hemocentros: {
    PUBLICO: '/contacto',
    DOADOR: '/doador/hemocentros',
    RECEPTOR: '/receptor/hemocentros',
    ADMIN: '/admin/hemocentros',
  },
  campanhas: { DOADOR: '/doador/campanhas', ADMIN: '/admin/campanhas' },
  estoque: { PUBLICO: '/estoque-publico', ADMIN: '/admin/estoque' },
  pedidos: {
    PUBLICO: '/register',
    RECEPTOR: '/receptor/requisicoes',
    ADMIN: '/admin/pedidos-transfusao',
  },
  historico: { DOADOR: '/doador/historico', RECEPTOR: '/receptor/historico' },
  notificacoes: {
    DOADOR: '/doador/notificacoes',
    RECEPTOR: '/receptor/notificacoes',
    ADMIN: '/admin/notificacoes',
  },
  contacto: { PUBLICO: '/contacto' },
  registar: { PUBLICO: '/register' },
  login: { PUBLICO: '/login' },
  sobre: { PUBLICO: '/sobre' },
};

function accao(perfil: PerfilUsuario | null, chave: ChaveRota, rotulo: string): AccaoBot | null {
  const rota = ROTAS[chave][perfil ?? PUBLICO];
  return rota ? { rotulo, rota } : null;
}

/** Descarta as acções que não existem para o perfil actual. */
function accoes(...lista: (AccaoBot | null)[]): AccaoBot[] | undefined {
  const validas = lista.filter((item): item is AccaoBot => item !== null);
  return validas.length > 0 ? validas : undefined;
}

function resposta(
  intencao: string,
  texto: string,
  sugestoes?: string[],
  listaAccoes?: AccaoBot[]
): RespostaBot {
  return { intencao, texto, sugestoes, accoes: listaAccoes };
}

// ---------------------------------------------------------------------------
// Textos de abertura
// ---------------------------------------------------------------------------

export const SUGESTOES_INICIAIS = [
  'Quem pode doar sangue?',
  'Como está o estoque?',
  'Sou O-, posso doar para quem?',
  'Quero agendar uma doação',
];

export function boasVindas(primeiroNome: string | null): RespostaBot {
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}!` : 'Olá!';
  return resposta(
    'boas_vindas',
    `${saudacao} Sou a **Sanguinha**, a assistente virtual do banco de sangue. \n\n` +
      'Posso esclarecer dúvidas sobre doação, explicar a compatibilidade entre tipos ' +
      'sanguíneos e consultar o estoque em tempo real.\n\n' +
      'Em que posso ajudar?',
    SUGESTOES_INICIAIS
  );
}

export function respostaFallback(contexto: ContextoConversa): RespostaBot {
  return resposta(
    'fallback',
    'Ainda não sei responder a isso. \n\n' +
      'Consigo ajudar-te com:\n' +
      '• Requisitos e impedimentos para doar\n' +
      '• Compatibilidade entre tipos sanguíneos\n' +
      '• Estoque disponível neste momento\n' +
      '• Agendamentos, hemocentros e campanhas\n\n' +
      'Podes reformular a pergunta ou escolher um dos temas abaixo.',
    SUGESTOES_INICIAIS,
    accoes(accao(contexto.perfil, 'contacto', 'Falar com a equipa'))
  );
}

// ---------------------------------------------------------------------------
// Estoque em tempo real (endpoint público, não exige autenticação)
// ---------------------------------------------------------------------------

interface ItemInventario {
  tipoSangue: string;
  totalMl: number;
  bolsas: number;
  status: 'critical' | 'low' | 'normal' | 'high';
}

interface ResumoEstoque {
  resumo: { totalMl: number; totalBolsas: number; criticos: number; baixos: number; atualizadoEm: string };
  inventario: ItemInventario[];
}

const NIVEL: Record<ItemInventario['status'], string> = {
  critical: 'crítico',
  low: 'baixo',
  normal: 'normal',
  high: 'confortável',
};

const numero = (valor: number) => valor.toLocaleString('pt-PT');

function horaCurta(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

async function responderEstoque(contexto: ContextoConversa): Promise<RespostaBot> {
  let dados: ResumoEstoque;
  try {
    dados = (await api.get<ResumoEstoque>('/publico/estoque-resumo')).data;
  } catch {
    return resposta(
      'estoque',
      'Não consegui consultar o estoque neste momento — o servidor não respondeu. ' +
        'Tenta novamente daqui a pouco.',
      ['Quem pode doar sangue?', 'Quero agendar uma doação'],
      accoes(accao(contexto.perfil, 'estoque', 'Ver quadro do estoque'))
    );
  }

  const { resumo, inventario } = dados;
  const verEstoque = accoes(accao(contexto.perfil, 'estoque', 'Ver quadro completo'));

  // Pergunta sobre um tipo específico: "tem O-?", "quantas bolsas de A+?"
  if (contexto.tipoSangue) {
    const item = inventario.find((linha) => linha.tipoSangue === contexto.tipoSangue);
    if (!item) return respostaFallback(contexto);

    const escasso = item.status === 'critical' || item.status === 'low';
    const apelo = escasso
      ? `\n\n️ O nível está **${NIVEL[item.status]}**. Se és compatível, a tua doação faz mesmo diferença.`
      : '';

    return resposta(
      'estoque',
      `**Estoque de ${item.tipoSangue}** (actualizado às ${horaCurta(resumo.atualizadoEm)})\n\n` +
        `• Bolsas disponíveis: **${item.bolsas}**\n` +
        `• Volume total: ${numero(item.totalMl)} mL\n` +
        `• Nível: **${NIVEL[item.status]}**${apelo}`,
      [`Quem pode doar para ${item.tipoSangue}?`, 'Como está o estoque geral?'],
      escasso
        ? accoes(accao(contexto.perfil, 'agendar', 'Agendar doação'), ...(verEstoque ?? []))
        : verEstoque
    );
  }

  const criticos = inventario.filter((item) => item.status === 'critical').map((item) => item.tipoSangue);
  const baixos = inventario.filter((item) => item.status === 'low').map((item) => item.tipoSangue);

  const linhas = [
    `Neste momento o banco tem **${resumo.totalBolsas} bolsas** (${numero(resumo.totalMl)} mL) ` +
      `no total, actualizado às ${horaCurta(resumo.atualizadoEm)}.`,
  ];

  if (criticos.length > 0) linhas.push(`\n Nível **crítico**: ${criticos.join(', ')}`);
  if (baixos.length > 0) linhas.push(`\n Nível **baixo**: ${baixos.join(', ')}`);
  if (criticos.length === 0 && baixos.length === 0) {
    linhas.push('\n Todos os tipos sanguíneos estão em níveis adequados. Obrigada a quem doou!');
  } else {
    linhas.push('\nUma única doação pode salvar até três vidas.');
  }

  return resposta(
    'estoque',
    linhas.join('\n'),
    ['Tem sangue O-?', 'Quero agendar uma doação', 'Quem pode doar sangue?'],
    accoes(accao(contexto.perfil, 'agendar', 'Agendar doação'), ...(verEstoque ?? []))
  );
}

// ---------------------------------------------------------------------------
// Compatibilidade
// ---------------------------------------------------------------------------

/** Distingue "posso doar para quem" de "quem pode doar para mim". */
function perguntaSobreReceber(normalizado: string): boolean {
  return /receber|recebo|quem me pode doar|quem pode doar para mim|doadores compativeis/.test(normalizado);
}

function responderCompatibilidade(contexto: ContextoConversa): RespostaBot {
  const tipo = contexto.tipoSangue;

  if (!tipo) {
    return resposta(
      'compatibilidade',
      'A compatibilidade depende do sistema **ABO** e do **factor Rh**.\n\n' +
        `• **${DOADOR_UNIVERSAL}** é o *dador universal*: pode doar glóbulos vermelhos a qualquer pessoa.\n` +
        `• **${RECEPTOR_UNIVERSAL}** é o *receptor universal*: pode receber de qualquer tipo.\n\n` +
        'Diz-me o teu tipo sanguíneo (por exemplo, "sou A+") e explico exactamente ' +
        'para quem podes doar e de quem podes receber.',
      ['Sou O-', 'Sou A+', 'Sou AB+', 'O que é o factor Rh?']
    );
  }

  const recebeDe = RECEBE_DE[tipo];
  const doaParaLista = doaPara(tipo);
  const foco = perguntaSobreReceber(contexto.normalizado);

  const notaUniversal =
    tipo === DOADOR_UNIVERSAL
      ? '\n\n És **dador universal** — o teu sangue serve a toda a gente. Tipo muito procurado!'
      : tipo === RECEPTOR_UNIVERSAL
        ? '\n\n És **receptor universal** — podes receber de qualquer tipo sanguíneo.'
        : '';

  const blocoDoa = ` **${tipo} pode doar para:** ${doaParaLista.join(', ')} (${doaParaLista.length} de 8)`;
  const blocoRecebe = ` **${tipo} pode receber de:** ${recebeDe.join(', ')} (${recebeDe.length} de 8)`;

  return resposta(
    'compatibilidade',
    // Responde primeiro ao que foi perguntado, mas mostra sempre os dois sentidos.
    `${foco ? blocoRecebe : blocoDoa}\n\n${foco ? blocoDoa : blocoRecebe}${notaUniversal}\n\n` +
      '_Nota: isto aplica-se a glóbulos vermelhos. Para plasma e plaquetas as regras são diferentes._',
    [`Tem sangue ${tipo} em estoque?`, 'Quero agendar uma doação', 'Quem pode doar sangue?'],
    accoes(accao(contexto.perfil, 'agendar', 'Agendar doação'))
  );
}

// ---------------------------------------------------------------------------
// Intenções
//
// A ordem importa: em caso de empate na pontuação, ganha a intenção que
// aparecer primeiro. Por isso as intenções específicas vêm antes das genéricas.
// ---------------------------------------------------------------------------

export const INTENCOES: Intencao[] = [
  {
    id: 'emergencia',
    gatilhos: ['urgente', 'urgencia', 'emergencia', 'socorro', 'ambulancia', 'risco de vida'],
    responder: (contexto) =>
      resposta(
        'emergencia',
        ' Se se trata de uma **emergência médica**, não percas tempo comigo: ' +
          'liga imediatamente para os serviços de emergência ou dirige-te ao hospital mais próximo.\n\n' +
          'Para um **pedido urgente de transfusão**, o hemocentro deve ser contactado directamente ' +
          'pela unidade hospitalar responsável pelo doente.',
        ['Como faço um pedido de transfusão?'],
        accoes(
          accao(contexto.perfil, 'contacto', 'Contactos do hemocentro'),
          accao(contexto.perfil, 'pedidos', 'Pedidos de transfusão')
        )
      ),
  },

  {
    id: 'agendar',
    gatilhos: [
      'agendar',
      'agendamento',
      'marcar',
      'marcacao',
      'quero doar',
      'quero ser doador',
      'como doar',
      'fazer uma doacao',
    ],
    responder: (contexto) => {
      if (contexto.perfil === 'DOADOR') {
        return resposta(
          'agendar',
          'Boa!  Para marcares a tua doação:\n\n' +
            '1. Abre **Agendar doação**\n' +
            '2. Escolhe o hemocentro, a data e a hora\n' +
            '3. Confirma — vais receber uma notificação com os detalhes\n\n' +
            'Chega com documento de identificação e evita jejum prolongado.',
          ['O que devo fazer antes de doar?', 'De quanto em quanto tempo posso doar?'],
          accoes(
            accao(contexto.perfil, 'agendar', 'Agendar doação'),
            accao(contexto.perfil, 'hemocentros', 'Ver hemocentros')
          )
        );
      }
      return resposta(
        'agendar',
        'Que óptima decisão!  Para doar sangue precisas de uma **conta de doador**.\n\n' +
          'Depois de te registares, podes escolher o hemocentro, a data e a hora directamente na plataforma.',
        ['Quem pode doar sangue?', 'O que devo fazer antes de doar?'],
        accoes(
          accao(contexto.perfil, 'registar', 'Criar conta de doador'),
          accao(contexto.perfil, 'login', 'Já tenho conta')
        )
      );
    },
  },

  {
    id: 'pedido_transfusao',
    gatilhos: [
      'preciso de sangue',
      'pedido de transfusao',
      'transfusao',
      'solicitar sangue',
      'requisicao',
      'receptor',
    ],
    responder: (contexto) => {
      if (contexto.perfil === 'RECEPTOR') {
        return resposta(
          'pedido_transfusao',
          'Podes submeter um pedido de transfusão em **Requisições**.\n\n' +
            'Indica o tipo sanguíneo, a quantidade e o hemocentro. ' +
            'O pedido passa por triagem da equipa clínica e vais ser notificado de cada mudança de estado.',
          ['Como está o estoque?', 'Onde ficam os hemocentros?'],
          accoes(
            accao(contexto.perfil, 'pedidos', 'Nova requisição'),
            accao(contexto.perfil, 'historico', 'Ver histórico')
          )
        );
      }
      return resposta(
        'pedido_transfusao',
        'Os pedidos de transfusão são feitos por **receptores registados** na plataforma, ' +
          'normalmente com o acompanhamento da unidade hospitalar.\n\n' +
          'Cada pedido é avaliado pela equipa do hemocentro antes de ser aprovado.',
        ['Como está o estoque?', 'Quem pode doar sangue?'],
        accoes(
          accao(contexto.perfil, 'registar', 'Criar conta de receptor'),
          accao(contexto.perfil, 'contacto', 'Falar com a equipa')
        )
      );
    },
  },

  {
    id: 'estoque',
    gatilhos: [
      'estoque',
      'stock',
      'disponivel',
      'disponibilidade',
      'quantas bolsas',
      'tem sangue',
      'ha sangue',
      'falta sangue',
      'reservas',
      'niveis de sangue',
    ],
    responder: responderEstoque,
  },

  {
    id: 'compatibilidade',
    gatilhos: [
      'compatibilidade',
      'compativel',
      'quem pode receber',
      'quem pode doar para mim',
      'para quem posso doar',
      'posso doar para',
      'posso receber de',
      'quem me pode doar',
      'doador universal',
      'dador universal',
      'receptor universal',
      'recebe de',
      'doadores compativeis',
    ],
    responder: responderCompatibilidade,
  },

  {
    id: 'requisitos',
    gatilhos: [
      'quem pode doar',
      'posso doar',
      'requisito',
      'criterio',
      'idade minima',
      'idade para doar',
      'peso minimo',
      'condicoes para doar',
    ],
    responder: (contexto) =>
      resposta(
        'requisitos',
        'Para doar sangue é preciso, em geral:\n\n' +
          '• Ter entre **18 e 65 anos**\n' +
          '• Pesar **no mínimo 50 kg**\n' +
          '• Estar de **boa saúde** no dia da doação\n' +
          '• Apresentar **documento de identificação** com fotografia\n' +
          '• Não estar em jejum e ter dormido pelo menos 6 horas\n\n' +
          'A aptidão final é sempre confirmada na **triagem clínica**, feita no próprio hemocentro.',
        ['Quem não pode doar?', 'De quanto em quanto tempo posso doar?', 'Quero agendar uma doação'],
        accoes(accao(contexto.perfil, 'agendar', 'Agendar doação'))
      ),
  },

  {
    id: 'impedimentos',
    gatilhos: ['quem nao pode doar', 'nao posso doar', 'estou impedido'],
    // Uma condição clínica mencionada sozinha ("tenho uma tatuagem, posso doar?")
    // tem de vencer o "posso doar" genérico da intenção `requisitos`.
    gatilhosFortes: [
      'impedimento',
      'contraindicacao',
      'tatuagem',
      'piercing',
      'gripe',
      'febre',
      'gravida',
      'gravidez',
      'amamentar',
      'medicamento',
      'anemia',
      'tomei vacina',
      'bebi alcool',
    ],
    responder: (contexto) =>
      resposta(
        'impedimentos',
        'Há **impedimentos temporários** e **definitivos**.\n\n' +
          ' **Temporários** (adia a doação):\n' +
          '• Gripe, febre ou infecção — aguardar a recuperação completa\n' +
          '• Tatuagem ou piercing recentes\n' +
          '• Gravidez e período de amamentação\n' +
          '• Consumo de álcool nas últimas 12 horas\n' +
          '• Alguns medicamentos e vacinas recentes\n\n' +
          ' **Definitivos**: certas doenças transmissíveis pelo sangue ou condições clínicas específicas.\n\n' +
          '_Cada caso é avaliado individualmente na triagem. Se tens dúvidas sobre a tua situação, ' +
          'fala com a equipa clínica do hemocentro._',
        ['Quem pode doar sangue?', 'O que devo fazer antes de doar?'],
        accoes(accao(contexto.perfil, 'contacto', 'Falar com a equipa'))
      ),
  },

  {
    id: 'intervalo',
    gatilhos: [
      'de quanto em quanto tempo',
      'quando posso doar de novo',
      'quando posso voltar a doar',
      'intervalo',
      'quantas vezes',
      'frequencia',
      'proxima doacao',
      'cada quanto tempo',
    ],
    responder: (contexto) =>
      resposta(
        'intervalo',
        'O intervalo mínimo entre doações de sangue total é:\n\n' +
          '• **Homens:** 60 dias — até 4 doações por ano\n' +
          '• **Mulheres:** 90 dias — até 3 doações por ano\n\n' +
          'Este período permite ao organismo repor completamente as reservas de ferro.',
        ['Quem pode doar sangue?', 'Quero agendar uma doação'],
        accoes(
          accao(contexto.perfil, 'historico', 'Ver o meu histórico'),
          accao(contexto.perfil, 'agendar', 'Agendar doação')
        )
      ),
  },

  {
    id: 'preparacao',
    gatilhos: [
      'antes de doar',
      'o que comer',
      'comer antes',
      'jejum',
      'preparacao',
      'preparar',
      'beber agua',
      'o que levar',
    ],
    responder: () =>
      resposta(
        'preparacao',
        'Antes de doar:\n\n' +
          ' Faz uma refeição ligeira — **não vás em jejum**\n' +
          ' Bebe bastante água nas horas anteriores\n' +
          ' Dorme pelo menos 6 horas na noite anterior\n' +
          ' Leva um documento de identificação com fotografia\n\n' +
          ' Evita alimentos gordurosos nas 4 horas anteriores\n' +
          ' Evita álcool nas 12 horas anteriores\n' +
          ' Não fumes na hora imediatamente antes',
        ['E depois de doar?', 'Quanto tempo demora a doação?', 'Quero agendar uma doação']
      ),
  },

  {
    id: 'pos_doacao',
    gatilhos: [
      'depois de doar',
      'apos doar',
      'depois da doacao',
      'cuidados',
      'recuperacao',
      'e depois',
      'posso trabalhar depois',
    ],
    responder: () =>
      resposta(
        'pos_doacao',
        'Depois da doação:\n\n' +
          '• Descansa 10 a 15 minutos e aceita o lanche que te oferecem\n' +
          '• Bebe mais líquidos do que o habitual durante o resto do dia\n' +
          '• Evita esforço físico intenso nas **12 horas** seguintes\n' +
          '• Não fumes na primeira hora nem consumas álcool nas 12 horas seguintes\n' +
          '• Mantém o penso no braço durante cerca de 4 horas\n\n' +
          'Se sentires tonturas, deita-te e eleva as pernas. É passageiro e pouco frequente.',
        ['De quanto em quanto tempo posso doar?', 'Doar sangue faz mal?']
      ),
  },

  {
    id: 'duracao',
    gatilhos: ['quanto tempo demora', 'quanto tempo dura', 'demora', 'duracao da doacao', 'quanto tempo leva'],
    responder: () =>
      resposta(
        'duracao',
        'A visita completa demora cerca de **40 a 60 minutos**:\n\n' +
          '• Registo e triagem clínica — 15 a 20 min\n' +
          '• **Recolha do sangue — apenas 8 a 12 min**\n' +
          '• Descanso e lanche — 15 min\n\n' +
          'São recolhidos cerca de 450 mL, menos de 10% do volume de sangue do corpo.',
        ['O que devo fazer antes de doar?', 'Quero agendar uma doação']
      ),
  },

  {
    id: 'seguranca',
    gatilhos: ['e seguro', 'faz mal', 'risco', 'pegar doenca', 'apanhar doenca'],
    // "posso apanhar uma doença ao doar?" — o verbo isolado chega para identificar o receio.
    gatilhosFortes: ['doi', 'dor', 'dores', 'agulha', 'medo', 'perigoso', 'contrair', 'apanhar', 'transmitir'],
    responder: () =>
      resposta(
        'seguranca',
        'Doar sangue é **seguro**. ️\n\n' +
          '• Todo o material é **descartável e estéril**, usado uma única vez\n' +
          '• É impossível contrair qualquer doença ao doar\n' +
          '• A picada da agulha dura poucos segundos — a maioria descreve-a como um beliscão\n' +
          '• O organismo repõe o volume de plasma em 24 a 48 horas\n\n' +
          'A doação é acompanhada por profissionais de saúde do início ao fim.',
        ['Quanto tempo demora a doação?', 'Porque devo doar sangue?', 'Quero agendar uma doação']
      ),
  },

  {
    id: 'beneficios',
    gatilhos: [
      'porque doar',
      'por que doar',
      'porque devo doar',
      'beneficio',
      'vantagem',
      'quantas vidas',
      'vale a pena',
      'importancia',
      'para que serve doar',
    ],
    responder: (contexto) =>
      resposta(
        'beneficios',
        'Porque cada doação conta: ️\n\n' +
          '• Uma única doação pode salvar **até 3 vidas** — o sangue é separado em glóbulos vermelhos, plasma e plaquetas\n' +
          '• O sangue **não se fabrica**: só existe se alguém doar\n' +
          '• Tem validade curta, por isso o estoque precisa de ser reposto continuamente\n' +
          '• Fazes um check-up gratuito: tensão arterial, hemoglobina e rastreio de infecções\n\n' +
          'Acidentados, doentes oncológicos, cirurgias e partos complicados dependem de ti.',
        ['Como está o estoque?', 'Quem pode doar sangue?'],
        accoes(accao(contexto.perfil, 'agendar', 'Agendar doação'))
      ),
  },

  {
    id: 'tipo_sangue_info',
    gatilhos: [
      'tipo sanguineo',
      'tipos de sangue',
      'grupo sanguineo',
      'factor rh',
      'fator rh',
      'o que e rh',
      'sistema abo',
    ],
    responder: () =>
      resposta(
        'tipo_sangue_info',
        'Existem **8 tipos sanguíneos**, definidos por dois sistemas:\n\n' +
          '• **ABO** — determina se tens antigénio A, B, ambos (AB) ou nenhum (O)\n' +
          '• **Factor Rh** — presença (+) ou ausência (−) do antigénio D\n\n' +
          'Combinando os dois: O−, O+, A−, A+, B−, B+, AB− e AB+.\n\n' +
          ` **${DOADOR_UNIVERSAL}** doa para todos · **${RECEPTOR_UNIVERSAL}** recebe de todos.\n\n` +
          'Diz-me o teu tipo e mostro-te a tua compatibilidade completa.',
        ['Sou O-', 'Sou A+', 'Como está o estoque?']
      ),
  },

  {
    id: 'hemocentros',
    gatilhos: [
      'hemocentro',
      'onde doar',
      'onde posso doar',
      'banco de sangue',
      'endereco',
      'localizacao',
      'perto de mim',
      'horario',
      'que horas',
      'hospital',
    ],
    responder: (contexto) =>
      resposta(
        'hemocentros',
        'Podes consultar a lista de hemocentros na plataforma, com **morada, telefone e horário** de cada um.\n\n' +
          'Ao agendares a doação, escolhes o hemocentro que te fica mais cómodo.',
        ['Quero agendar uma doação', 'Há campanhas a decorrer?'],
        accoes(
          accao(contexto.perfil, 'hemocentros', 'Ver hemocentros'),
          accao(contexto.perfil, 'agendar', 'Agendar doação')
        )
      ),
  },

  {
    id: 'campanhas',
    gatilhos: ['campanha', 'evento', 'mobilizacao', 'colecta', 'coleta externa'],
    responder: (contexto) =>
      resposta(
        'campanhas',
        'As campanhas são acções de recolha organizadas pelos hemocentros, muitas vezes ' +
          'em resposta a níveis críticos de estoque.\n\n' +
          'Cada campanha tem uma meta de unidades, datas de início e fim, e o hemocentro responsável.',
        ['Como está o estoque?', 'Quero agendar uma doação'],
        accoes(
          accao(contexto.perfil, 'campanhas', 'Ver campanhas'),
          accao(contexto.perfil, 'registar', 'Criar conta para participar')
        )
      ),
  },

  {
    id: 'conta',
    gatilhos: [
      'criar conta',
      'registar',
      'registrar',
      'cadastro',
      'fazer login',
      'entrar na conta',
      'esqueci a senha',
      'palavra passe',
      'password',
      'senha',
      'nao consigo entrar',
    ],
    responder: (contexto) => {
      if (contexto.perfil) {
        return resposta(
          'conta',
          'Já tens sessão iniciada.  Podes rever e actualizar os teus dados na página de **Perfil**, ' +
            'e acompanhar tudo o que se passa em **Notificações**.',
          ['Como está o estoque?', 'Quero agendar uma doação'],
          accoes(accao(contexto.perfil, 'notificacoes', 'Ver notificações'))
        );
      }
      return resposta(
        'conta',
        'Podes criar conta como **doador** (para doar sangue) ou como **receptor** ' +
          '(para submeter pedidos de transfusão).\n\n' +
          'O registo demora menos de dois minutos.',
        ['Quem pode doar sangue?', 'Como faço um pedido de transfusão?'],
        accoes(
          accao(contexto.perfil, 'registar', 'Criar conta'),
          accao(contexto.perfil, 'login', 'Entrar')
        )
      );
    },
  },

  {
    id: 'historico',
    gatilhos: [
      'historico',
      'minhas doacoes',
      'meus pedidos',
      'comprovativo',
      'certificado',
      'exportar pdf',
      'quantas vezes ja doei',
    ],
    responder: (contexto) => {
      const ligacao = accoes(accao(contexto.perfil, 'historico', 'Ver histórico'));
      if (!ligacao) {
        return resposta(
          'historico',
          'O histórico de doações e de pedidos fica disponível na tua área pessoal, ' +
            'depois de iniciares sessão.',
          ['Como criar conta?'],
          accoes(accao(contexto.perfil, 'login', 'Entrar'))
        );
      }
      return resposta(
        'historico',
        'Em **Histórico** encontras todas as tuas doações e pedidos, com data, hemocentro e estado. ' +
          'Podes ainda exportar o registo em PDF.',
        ['De quanto em quanto tempo posso doar?'],
        ligacao
      );
    },
  },

  {
    id: 'contacto',
    gatilhos: [
      'contacto',
      'contato',
      'telefone',
      'email',
      'falar com uma pessoa',
      'falar com alguem',
      'atendente',
      'humano',
      'suporte',
      'reclamacao',
    ],
    responder: (contexto) =>
      resposta(
        'contacto',
        'Claro. Para falar com uma pessoa da equipa, usa a página de **Contacto** — ' +
          'tens lá o telefone, o e-mail e um formulário de mensagem.\n\n' +
          'Para assuntos clínicos, contacta directamente o hemocentro onde vais doar.',
        ['Onde ficam os hemocentros?'],
        accoes(
          accao(contexto.perfil, 'contacto', 'Página de contacto'),
          accao(contexto.perfil, 'hemocentros', 'Ver hemocentros')
        )
      ),
  },

  {
    id: 'aconselhamento_medico',
    gatilhos: ['sintoma', 'diagnostico', 'tratamento', 'estou doente', 'consulta medica', 'que doenca tenho'],
    responder: (contexto) =>
      resposta(
        'aconselhamento_medico',
        'Sou uma assistente virtual e **não substituo um profissional de saúde** — ' +
          'não posso dar diagnósticos nem aconselhamento médico.\n\n' +
          'Para questões clínicas, fala com o teu médico ou com a equipa do hemocentro. ' +
          'Sobre doação, respondo a tudo o que precisares. ',
        ['Quem pode doar sangue?', 'Quem não pode doar?'],
        accoes(accao(contexto.perfil, 'contacto', 'Falar com a equipa'))
      ),
  },

  {
    id: 'identidade',
    gatilhos: [
      'sanguinha',
      'quem es tu',
      'quem e voce',
      'qual e o teu nome',
      'como te chamas',
      'o que podes fazer',
      'o que sabes fazer',
      'es um robo',
      'es humana',
      'ajuda',
      'help',
      'menu',
    ],
    responder: (contexto) =>
      resposta(
        'identidade',
        'Sou a **Sanguinha** , a assistente virtual do banco de sangue. Não sou humana — ' +
          'sou um programa que percebe as tuas perguntas e responde com informação sobre doação.\n\n' +
          'Sei ajudar-te com:\n' +
          '• **Doação** — requisitos, impedimentos, intervalos, preparação e cuidados\n' +
          '• **Compatibilidade** — quem pode doar ou receber de quem\n' +
          '• **Estoque** — consulta em tempo real, por tipo sanguíneo\n' +
          '• **Plataforma** — agendamentos, hemocentros, campanhas e pedidos\n\n' +
          'Experimenta perguntar à vontade!',
        SUGESTOES_INICIAIS,
        accoes(accao(contexto.perfil, 'sobre', 'Sobre o projecto'))
      ),
  },

  {
    id: 'agradecimento',
    gatilhos: ['obrigado', 'obrigada', 'valeu', 'agradeco', 'muito obrigado', 'grato', 'brigado'],
    responder: () =>
      resposta(
        'agradecimento',
        'De nada!  Estou aqui sempre que precisares.\n\nE lembra-te: **doar sangue salva vidas**. ',
        ['Quero agendar uma doação', 'Como está o estoque?']
      ),
  },

  {
    id: 'saudacao',
    gatilhos: ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'opa', 'tudo bem', 'como estas'],
    responder: (contexto) =>
      resposta(
        'saudacao',
        `${contexto.primeiroNome ? `Olá, ${contexto.primeiroNome}!` : 'Olá!'}  ` +
          'Sou a Sanguinha. Como posso ajudar hoje?',
        SUGESTOES_INICIAIS
      ),
  },

  {
    id: 'despedida',
    gatilhos: ['tchau', 'adeus', 'ate logo', 'ate breve', 'xau', 'falou', 'ate mais'],
    responder: () =>
      resposta(
        'despedida',
        'Até breve!  Se decidires doar, o teu gesto vai fazer diferença na vida de alguém. ️'
      ),
  },
];
